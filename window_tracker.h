#ifndef WINDOW_TRACKER_H
#define WINDOW_TRACKER_H

#include <napi.h>
#include <Foundation/Foundation.h>
#include <AppKit/AppKit.h>

namespace window_tracker {

class WindowTracker : public Napi::ObjectWrap<WindowTracker> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  WindowTracker(const Napi::CallbackInfo& info);

 private:
  Napi::Value GetChromeWindowBounds(const Napi::CallbackInfo& info);
};

}

#endif // WINDOW_TRACKER_H 