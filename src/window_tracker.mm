#include "window_tracker.h"
#include <Cocoa/Cocoa.h>

namespace window_tracker {

WindowTracker::WindowTracker(const Napi::CallbackInfo& info) 
    : Napi::ObjectWrap<WindowTracker>(info) {}

Napi::Object WindowTracker::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "WindowTracker", {
        InstanceMethod("getChromeWindowBounds", &WindowTracker::GetChromeWindowBounds)
    });

    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);

    exports.Set("WindowTracker", func);
    return exports;
}

Napi::Value WindowTracker::GetChromeWindowBounds(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    @autoreleasepool {
        // Get all running applications
        NSWorkspace* workspace = [NSWorkspace sharedWorkspace];
        NSArray* runningApps = [workspace runningApplications];
        
        // Find Chrome
        NSRunningApplication* chromeApp = nil;
        for (NSRunningApplication* app in runningApps) {
            if ([[app bundleIdentifier] isEqualToString:@"com.google.Chrome"]) {
                chromeApp = app;
                break;
            }
        }
        
        if (chromeApp) {
            // Get all windows
            CFArrayRef windowList = CGWindowListCopyWindowInfo(
                kCGWindowListOptionOnScreenOnly | kCGWindowListExcludeDesktopElements,
                kCGNullWindowID);
            
            if (windowList) {
                CFIndex count = CFArrayGetCount(windowList);
                
                for (CFIndex i = 0; i < count; i++) {
                    CFDictionaryRef window = (CFDictionaryRef)CFArrayGetValueAtIndex(windowList, i);
                    
                    // Get the window owner PID
                    CFNumberRef pidRef = (CFNumberRef)CFDictionaryGetValue(window, kCGWindowOwnerPID);
                    pid_t pid;
                    CFNumberGetValue(pidRef, kCFNumberIntType, &pid);
                    
                    // Check if this window belongs to Chrome
                    if (pid == [chromeApp processIdentifier]) {
                        // Get window bounds
                        CGRect bounds;
                        CFDictionaryRef boundsDict = (CFDictionaryRef)CFDictionaryGetValue(window, kCGWindowBounds);
                        CGRectMakeWithDictionaryRepresentation(boundsDict, &bounds);
                        
                        // Create return object with window bounds
                        Napi::Object result = Napi::Object::New(env);
                        result.Set("x", bounds.origin.x);
                        result.Set("y", bounds.origin.y);
                        result.Set("width", bounds.size.width);
                        result.Set("height", bounds.size.height);
                        
                        CFRelease(windowList);
                        return result;
                    }
                }
                
                CFRelease(windowList);
            }
        }
    }
    
    // Return null if Chrome window not found
    return env.Null();
}

}  // namespace window_tracker

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    return window_tracker::WindowTracker::Init(env, exports);
}

NODE_API_MODULE(window_tracker, Init) 