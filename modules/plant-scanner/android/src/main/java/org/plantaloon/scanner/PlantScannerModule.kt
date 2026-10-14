package org.plantaloon.scanner

import ai.onnxruntime.OnnxTensor
import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileInputStream
import java.nio.FloatBuffer
import java.security.MessageDigest

private const val SIZE = 224
// BioCLIP's (OpenAI CLIP's) image normalisation.
private val MEAN = floatArrayOf(0.48145466f, 0.4578275f, 0.40821073f)
private val STD = floatArrayOf(0.26862954f, 0.26130258f, 0.27577711f)

/**
 * Runs the plant-recognition model (BioCLIP's image encoder, int8 ONNX) on a photo and returns
 * its 512-number fingerprint. Matching against the catalog happens in JavaScript. Everything
 * stays on the phone.
 */
class PlantScannerModule : Module() {
  private var env: OrtEnvironment? = null
  private var session: OrtSession? = null
  private var sessionPath: String? = null

  override fun definition() = ModuleDefinition {
    Name("PlantScanner")

    AsyncFunction("embed") { modelUri: String, imageUri: String ->
      embed(pathOf(modelUri), pathOf(imageUri)).toList()
    }

    AsyncFunction("sha256") { fileUri: String ->
      sha256(pathOf(fileUri))
    }

    Function("release") { release() }

    OnDestroy { release() }
  }

  private fun pathOf(uri: String): String =
    if (uri.startsWith("file:")) Uri.parse(uri).path ?: uri else uri

  @Synchronized
  private fun open(modelPath: String): OrtSession {
    session?.let { if (sessionPath == modelPath) return it }
    release()
    val environment = env ?: OrtEnvironment.getEnvironment().also { env = it }
    val options = OrtSession.SessionOptions().apply {
      setIntraOpNumThreads(Runtime.getRuntime().availableProcessors().coerceIn(1, 4))
    }
    return environment.createSession(modelPath, options).also {
      session = it
      sessionPath = modelPath
    }
  }

  @Synchronized
  private fun release() {
    session?.close()
    session = null
    sessionPath = null
  }

  private fun embed(modelPath: String, imagePath: String): FloatArray {
    require(File(modelPath).exists()) { "The scanner model isn't downloaded." }
    val bitmap = BitmapFactory.decodeFile(imagePath) ?: throw IllegalArgumentException("Couldn't read the photo.")
    val input = preprocess(bitmap)
    val environment = env ?: OrtEnvironment.getEnvironment().also { env = it }
    val model = open(modelPath)
    OnnxTensor.createTensor(environment, FloatBuffer.wrap(input), longArrayOf(1, 3, SIZE.toLong(), SIZE.toLong())).use { tensor ->
      model.run(mapOf(model.inputNames.first() to tensor)).use { result ->
        @Suppress("UNCHECKED_CAST")
        val output = result[0].value as Array<FloatArray>
        return output[0]
      }
    }
  }

  /** Short side to 224 px, centre crop to 224 × 224, normalise, planar RGB. */
  private fun preprocess(source: Bitmap): FloatArray {
    val scale = SIZE.toFloat() / minOf(source.width, source.height)
    val w = maxOf(SIZE, Math.round(source.width * scale))
    val h = maxOf(SIZE, Math.round(source.height * scale))
    val scaled = Bitmap.createScaledBitmap(source, w, h, true)
    val cropped = Bitmap.createBitmap(scaled, (w - SIZE) / 2, (h - SIZE) / 2, SIZE, SIZE)
    val pixels = IntArray(SIZE * SIZE)
    cropped.getPixels(pixels, 0, SIZE, 0, 0, SIZE, SIZE)
    val plane = SIZE * SIZE
    val out = FloatArray(3 * plane)
    for (i in 0 until plane) {
      val p = pixels[i]
      out[i] = (((p shr 16) and 0xFF) / 255f - MEAN[0]) / STD[0]
      out[plane + i] = (((p shr 8) and 0xFF) / 255f - MEAN[1]) / STD[1]
      out[2 * plane + i] = ((p and 0xFF) / 255f - MEAN[2]) / STD[2]
    }
    if (scaled !== source) scaled.recycle()
    if (cropped !== scaled) cropped.recycle()
    source.recycle()
    return out
  }

  private fun sha256(path: String): String {
    val digest = MessageDigest.getInstance("SHA-256")
    FileInputStream(path).use { stream ->
      val buffer = ByteArray(1 shl 20)
      while (true) {
        val n = stream.read(buffer)
        if (n < 0) break
        digest.update(buffer, 0, n)
      }
    }
    return digest.digest().joinToString("") { "%02x".format(it) }
  }
}
