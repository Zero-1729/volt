package com.volt.modules.SplashScreen;

import android.app.Activity;
import android.app.Dialog;
import android.os.Build;

import androidx.annotation.NonNull;

import com.volt.R;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.lang.ref.WeakReference;

public class SplashScreenModule extends ReactContextBaseJavaModule {
    private static WeakReference<Activity> mainActivityRef;
    private static Dialog splashDialog;

    /* Boilerplate */
    SplashScreenModule(@NonNull ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    @NonNull
    public String getName() {
        return "SplashScreenModule";
    }

    /* React Native method */
    @ReactMethod
    public void hide() {
        Activity currentActivity = getCurrentActivity();

        if (currentActivity == null && mainActivityRef != null) {
            currentActivity = mainActivityRef.get();
        }

        if (currentActivity == null || splashDialog == null) {
            return;
        }

        final Activity activity = currentActivity;

        activity.runOnUiThread(() -> {
            boolean isDestroyed = false;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
                isDestroyed = activity.isDestroyed();
            }

            if (
                    !activity.isFinishing() &&
                            !isDestroyed &&
                            splashDialog != null &&
                            splashDialog.isShowing()
            ) {
                splashDialog.dismiss();
            }

            splashDialog = null;
        });
    }

    /* Native util */
    public static void show(@NonNull final Activity activity) {
        mainActivityRef = new WeakReference<>(activity);

        activity.runOnUiThread(() -> {
            // Leave out the second argument if you're not using animations
            splashDialog = new Dialog(activity, R.style.AppTheme_SplashDialog);
            splashDialog.setContentView(R.layout.splash_screen);
            splashDialog.setCancelable(false);

            if (!splashDialog.isShowing() && !activity.isFinishing()) {
                splashDialog.show();
            }
        });
    }
}