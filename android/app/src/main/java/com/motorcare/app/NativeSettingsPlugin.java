package com.motorcare.app;

import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.provider.Settings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "NativeSettings")
public class NativeSettingsPlugin extends Plugin {

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        try {
            Intent intent = new Intent();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                intent.setAction(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                intent.putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
            } else {
                intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.fromParts("package", getContext().getPackageName(), null));
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            try {
                Intent fallback = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                fallback.setData(Uri.fromParts("package", getContext().getPackageName(), null));
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(fallback);
                call.resolve();
            } catch (Exception ex) {
                call.reject("Failed to open notification settings: " + ex.getMessage());
            }
        }
    }

    /**
     * طباعة مستندات HTML أو تحويلها إلى PDF أصلي عبر Android PrintManager الرسمي
     */
    @PluginMethod
    public void printHtml(PluginCall call) {
        String html = call.getString("html");
        String jobName = call.getString("jobName", "MotorCare_Report");
        if (html == null || html.isEmpty()) {
            call.reject("HTML content is required for printing");
            return;
        }

        getActivity().runOnUiThread(() -> {
            try {
                WebView printWebView = new WebView(getContext());
                printWebView.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        try {
                            PrintManager printManager = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                            if (printManager != null) {
                                PrintDocumentAdapter printAdapter;
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                                    printAdapter = view.createPrintDocumentAdapter(jobName);
                                } else {
                                    printAdapter = view.createPrintDocumentAdapter();
                                }
                                PrintAttributes.Builder builder = new PrintAttributes.Builder();
                                builder.setColorMode(PrintAttributes.COLOR_MODE_COLOR);
                                builder.setMediaSize(PrintAttributes.MediaSize.ISO_A4);
                                printManager.print(jobName, printAdapter, builder.build());
                                JSObject res = new JSObject();
                                res.put("success", true);
                                call.resolve(res);
                            } else {
                                call.reject("PrintManager service not available");
                            }
                        } catch (Exception e) {
                            call.reject("Error creating print job: " + e.getMessage());
                        }
                    }
                });
                printWebView.loadDataWithBaseURL("https://localhost/", html, "text/html", "UTF-8", null);
            } catch (Exception e) {
                call.reject("Failed to initialize print WebView: " + e.getMessage());
            }
        });
    }

    /**
     * حفظ ملفات النسخ الاحتياطي (JSON / CSV) مباشرة في مجلد التنزيلات العام للهاتف (Downloads/MotorCare)
     */
    @PluginMethod
    public void saveToDownloads(PluginCall call) {
        String filename = call.getString("filename", "MotorCare_Backup.json");
        String content = call.getString("content", "");
        String mimeType = call.getString("mimeType", "application/json");

        try {
            String savedPath;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/MotorCare");

                Uri uri = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) {
                    call.reject("Failed to create MediaStore entry");
                    return;
                }
                OutputStream out = getContext().getContentResolver().openOutputStream(uri);
                if (out != null) {
                    out.write(content.getBytes(StandardCharsets.UTF_8));
                    out.flush();
                    out.close();
                }
                savedPath = "Downloads/MotorCare/" + filename;
            } else {
                File downloadDir = new File(
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                    "MotorCare"
                );
                if (!downloadDir.exists()) {
                    downloadDir.mkdirs();
                }
                File destFile = new File(downloadDir, filename);
                FileOutputStream fos = new FileOutputStream(destFile);
                fos.write(content.getBytes(StandardCharsets.UTF_8));
                fos.flush();
                fos.close();

                MediaScannerConnection.scanFile(
                    getContext(),
                    new String[]{destFile.getAbsolutePath()},
                    new String[]{mimeType},
                    null
                );
                savedPath = destFile.getAbsolutePath();
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("path", savedPath);
            ret.put("filename", filename);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to save file to downloads: " + e.getMessage());
        }
    }
}
