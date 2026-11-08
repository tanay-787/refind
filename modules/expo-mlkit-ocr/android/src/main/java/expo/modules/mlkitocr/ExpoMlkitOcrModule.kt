package expo.modules.mlkitocr

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.Text
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.TextRecognizer
import com.google.mlkit.vision.text.devanagari.DevanagariTextRecognizerOptions
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.io.File
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL

class ExpoMlkitOcrModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoMlkitOcr")

    AsyncFunction("recognizeText") Coroutine { imageUri: String, detectorType: String? ->
      withContext(Dispatchers.Default) {
        val context = appContext.reactContext
          ?: throw IllegalStateException("React application context is null")

        val image = loadImage(context, imageUri)
          ?: throw IllegalArgumentException("Failed to load image from URI: $imageUri")

        val recognizer = getRecognizer(detectorType)
        val visionText: Text = recognizer.process(image).await()

        convertTextToMap(visionText)
      }
    }

    AsyncFunction("getAvailableLanguages") {
      listOf("latin", "devanagari")
    }
  }

  private fun getRecognizer(detectorType: String?): TextRecognizer {
    return when (detectorType?.lowercase()) {
      "devanagari" -> TextRecognition.getClient(DevanagariTextRecognizerOptions.Builder().build())
      else -> TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
    }
  }

  private fun loadImage(context: Context, uri: String): InputImage? {
    return try {
      if (uri.startsWith("http://") || uri.startsWith("https://")) {
        val bitmap = downloadBitmap(uri)
        if (bitmap != null) return InputImage.fromBitmap(bitmap, 0)
        return null
      }
      val cleanPath = if (uri.startsWith("file://")) uri.substring(7) else uri
      val file = File(cleanPath)
      if (file.exists()) {
        val bitmap = BitmapFactory.decodeFile(cleanPath)
        if (bitmap != null) return InputImage.fromBitmap(bitmap, 0)
      }
      val contentUri = Uri.parse(uri)
      InputImage.fromFilePath(context, contentUri)
    } catch (e: Exception) {
      e.printStackTrace()
      null
    }
  }

  private fun downloadBitmap(urlString: String): Bitmap? {
    var connection: HttpURLConnection? = null
    var inputStream: InputStream? = null
    return try {
      val url = URL(urlString)
      connection = url.openConnection() as HttpURLConnection
      connection.connectTimeout = 15000
      connection.readTimeout = 15000
      connection.requestMethod = "GET"
      connection.doInput = true
      connection.connect()
      if (connection.responseCode == HttpURLConnection.HTTP_OK) {
        inputStream = connection.inputStream
        BitmapFactory.decodeStream(inputStream)
      } else {
        null
      }
    } catch (e: Exception) {
      null
    } finally {
      inputStream?.close()
      connection?.disconnect()
    }
  }

  private fun convertTextToMap(visionText: Text): Map<String, Any> {
    val blocksList = visionText.textBlocks.map { block ->
      val linesList = block.lines.map { line ->
        val elementsList = line.elements.map { element ->
          mapOf(
            "text" to element.text,
            "frame" to getFrameMap(element.boundingBox)
          )
        }
        mapOf(
          "text" to line.text,
          "frame" to getFrameMap(line.boundingBox),
          "elements" to elementsList
        )
      }
      mapOf(
        "text" to block.text,
        "frame" to getFrameMap(block.boundingBox),
        "lines" to linesList
      )
    }

    return mapOf(
      "text" to visionText.text,
      "blocks" to blocksList
    )
  }

  private fun getFrameMap(boundingBox: android.graphics.Rect?): Map<String, Double> {
    return mapOf(
      "x" to (boundingBox?.left?.toDouble() ?: 0.0),
      "y" to (boundingBox?.top?.toDouble() ?: 0.0),
      "width" to (boundingBox?.width()?.toDouble() ?: 0.0),
      "height" to (boundingBox?.height()?.toDouble() ?: 0.0)
    )
  }
}
