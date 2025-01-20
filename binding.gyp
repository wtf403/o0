{
    "targets": [
        {
            "target_name": "window_tracker",
            "sources": ["window_tracker.mm"],
            "include_dirs": ["<!@(node -p \"require('node-addon-api').include\")"],
            "dependencies": ["<!(node -p \"require('node-addon-api').gyp\")"],
            "cflags!": ["-fno-exceptions"],
            "cflags_cc!": ["-fno-exceptions"],
            "xcode_settings": {
                "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
                "CLANG_CXX_LIBRARY": "libc++",
                "MACOSX_DEPLOYMENT_TARGET": "10.15",
            },
            "link_settings": {
                "libraries": ["$(SDKROOT)/System/Library/Frameworks/Cocoa.framework"]
            },
        }
    ]
}
