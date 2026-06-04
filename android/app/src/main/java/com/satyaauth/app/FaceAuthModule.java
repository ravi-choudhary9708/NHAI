package com.satyaauth.app;

import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableNativeMap;
import org.tensorflow.lite.Interpreter;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.channels.FileChannel;
import java.nio.MappedByteBuffer;

public class FaceAuthModule extends ReactContextBaseJavaModule {
    private Interpreter blazeFaceInterpreter;
    private Interpreter blinkInterpreter;
    private Interpreter faceNetInterpreter;

    FaceAuthModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "FaceAuthNative";
    }

    private MappedByteBuffer loadModelFile(String modelName) throws Exception {
        AssetManager assetManager = getReactApplicationContext().getAssets();
        AssetFileDescriptor fileDescriptor = assetManager.openFd(modelName);
        FileInputStream inputStream = new FileInputStream(fileDescriptor.getFileDescriptor());
        FileChannel fileChannel = inputStream.getChannel();
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, fileDescriptor.getStartOffset(), fileDescriptor.getDeclaredLength());
    }

    @ReactMethod
    public void initModels(Promise promise) {
        try {
            Interpreter.Options options = new Interpreter.Options();
            options.setNumThreads(4);
            blazeFaceInterpreter = new Interpreter(loadModelFile("blazeface_satya_v1.tflite"), options);
            blinkInterpreter = new Interpreter(loadModelFile("liveness_net_satya_v1.tflite"), options);
            faceNetInterpreter = new Interpreter(loadModelFile("mobilefacenet_int8_satya_v1.tflite"), options);
            promise.resolve("Models Loaded");
        } catch (Exception e) {
            promise.reject("LOAD_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void processFrame(String imageUri, Promise promise) {
        try {
            Uri uri = Uri.parse(imageUri);
            InputStream inputStream = getReactApplicationContext().getContentResolver().openInputStream(uri);
            Bitmap bitmap = BitmapFactory.decodeStream(inputStream);
            if (bitmap == null) {
                promise.reject("ERROR", "Invalid Image");
                return;
            }

            Bitmap resizedBlaze = Bitmap.createScaledBitmap(bitmap, 128, 128, true);
            ByteBuffer blazeInput = convertBitmapToByteBuffer(resizedBlaze, 128);
            float[][][] outputBoxes = new float[1][896][16];
            float[][][] outputScores = new float[1][896][1];
            Object[] inputs = {blazeInput};
            java.util.Map<Integer, Object> outputs = new java.util.HashMap<>();
            outputs.put(0, outputBoxes);
            outputs.put(1, outputScores);
            
            blazeFaceInterpreter.runForMultipleInputsOutputs(inputs, outputs);

            boolean faceDetected = false;
            for (int i = 0; i < 896; i++) {
                if (outputScores[0][i][0] > 0.75) {
                    faceDetected = true;
                    break;
                }
            }

            if (!faceDetected) {
                WritableMap map = new WritableNativeMap();
                map.putString("status", "NO_FACE");
                promise.resolve(map);
                return;
            }

            Bitmap resizedBlink = Bitmap.createScaledBitmap(bitmap, 64, 64, true);
            ByteBuffer blinkInput = convertBitmapToByteBuffer(resizedBlink, 64);
            float[][] blinkOutput = new float[1][213];
            blinkInterpreter.run(blinkInput, blinkOutput);

            float sum = 0;
            for (float val : blinkOutput[0]) {
                sum += val;
            }
            float mean = sum / 213;
            float varianceSum = 0;
            for (float val : blinkOutput[0]) {
                varianceSum += (val - mean) * (val - mean);
            }
            float variance = varianceSum / 213;

            WritableMap map = new WritableNativeMap();
            map.putString("status", "FACE_DETECTED");
            map.putDouble("blinkScore", variance * 1000);
            promise.resolve(map);

        } catch (Exception e) {
            promise.reject("PROC_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getEmbedding(String imageUri, Promise promise) {
        try {
            Uri uri = Uri.parse(imageUri);
            InputStream inputStream = getReactApplicationContext().getContentResolver().openInputStream(uri);
            Bitmap bitmap = BitmapFactory.decodeStream(inputStream);
            if (bitmap == null) {
                promise.reject("ERROR", "Invalid Image");
                return;
            }

            Bitmap resizedFace = Bitmap.createScaledBitmap(bitmap, 112, 112, true);
            ByteBuffer faceInput = ByteBuffer.allocateDirect(301056);
            faceInput.order(ByteOrder.nativeOrder());
            
            int[] intValues = new int[112 * 112];
            resizedFace.getPixels(intValues, 0, resizedFace.getWidth(), 0, 0, resizedFace.getWidth(), resizedFace.getHeight());
            for (int pixelValue : intValues) {
                faceInput.putFloat((((pixelValue >> 16) & 0xFF) - 127.5f) / 127.5f);
                faceInput.putFloat((((pixelValue >> 8) & 0xFF) - 127.5f) / 127.5f);
                faceInput.putFloat(((pixelValue & 0xFF) - 127.5f) / 127.5f);
            }

            float[][] faceOutput = new float[2][192];
            faceNetInterpreter.run(faceInput, faceOutput);

            WritableArray array = Arguments.createArray();
            for (float val : faceOutput[0]) {
                array.pushDouble(val);
            }
            promise.resolve(array);
        } catch (Exception e) {
            promise.reject("EMB_ERROR", e.getMessage());
        }
    }

    private ByteBuffer convertBitmapToByteBuffer(Bitmap bitmap, int size) {
        ByteBuffer byteBuffer = ByteBuffer.allocateDirect(4 * size * size * 3);
        byteBuffer.order(ByteOrder.nativeOrder());
        int[] intValues = new int[size * size];
        bitmap.getPixels(intValues, 0, bitmap.getWidth(), 0, 0, bitmap.getWidth(), bitmap.getHeight());
        for (int pixelValue : intValues) {
            byteBuffer.putFloat((((pixelValue >> 16) & 0xFF) - 127.5f) / 127.5f);
            byteBuffer.putFloat((((pixelValue >> 8) & 0xFF) - 127.5f) / 127.5f);
            byteBuffer.putFloat(((pixelValue & 0xFF) - 127.5f) / 127.5f);
        }
        return byteBuffer;
    }
}