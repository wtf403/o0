package main

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"howett.net/plist"
	"time"
	"io"
	"bufio"
	"bytes"
	"unsafe"
)

var logFile *os.File
var nativeEndian binary.ByteOrder
var bufferSize = 8192
const maxMessageSize = 1024 * 1024 // Maximum message size (1MB)

func init() {
	// Determine native byte order
	var one int16 = 1
	b := (*byte)(unsafe.Pointer(&one))
	if *b == 0 {
		nativeEndian = binary.BigEndian
	} else {
		nativeEndian = binary.LittleEndian
	}
}

func initLogFile() error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	
	logPath := filepath.Join(homeDir, "Desktop", "safari_reading_list.log")
	f, err := os.OpenFile(logPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	logFile = f
	return nil
}

func writeToLog(message string) {
	if logFile != nil {
		timestamp := time.Now().Format("2006-01-02 15:04:05")
		fmt.Fprintf(logFile, "[%s] %s\n", timestamp, message)
	}
}

func getMessage() (map[string]interface{}, error) {
	reader := bufio.NewReaderSize(os.Stdin, bufferSize)
	
	lengthBytes := make([]byte, 4)
	if _, err := io.ReadFull(reader, lengthBytes); err != nil {
		if err == io.EOF {
			return nil, fmt.Errorf("browser disconnected: %v", err)
		}
		return nil, err
	}

	var length uint32
	if err := binary.Read(bytes.NewReader(lengthBytes), nativeEndian, &length); err != nil {
		return nil, err
	}

	// Check message size limit
	if length > maxMessageSize {
		return nil, fmt.Errorf("message size %d exceeds maximum allowed size of %d", length, maxMessageSize)
	}

	message := make([]byte, length)
	if _, err := io.ReadFull(reader, message); err != nil {
		return nil, err
	}

	writeToLog(fmt.Sprintf("Received message: %s", string(message)))
	
	var result map[string]interface{}
	if err := json.Unmarshal(message, &result); err != nil {
		writeToLog(fmt.Sprintf("Error unmarshaling message: %v", err))
		return nil, err
	}

	return result, nil
}

func sendMessage(message interface{}) error {
	jsonData, err := json.Marshal(message)
	if err != nil {
		writeToLog(fmt.Sprintf("Error marshaling message: %v", err))
		return err
	}

	messageLength := len(jsonData) // This correctly counts bytes, not characters
	if messageLength > maxMessageSize {
		return fmt.Errorf("message size %d exceeds maximum allowed size of %d", messageLength, maxMessageSize)
	}

	writeToLog(fmt.Sprintf("Sending message: %s", string(jsonData)))
	
	// Write length in native byte order
	if err := binary.Write(os.Stdout, nativeEndian, uint32(messageLength)); err != nil {
		return err
	}
	
	// Write the message
	if _, err := os.Stdout.Write(jsonData); err != nil {
		return err
	}

	return nil
}

func readBookmarks() map[string]interface{} {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error":   fmt.Sprintf("Error getting home directory: %v", err),
		}
	}

	bookmarksPath := filepath.Join(homeDir, "Library/Safari/Bookmarks.plist")
	
	bookmarksFile, err := os.Open(bookmarksPath)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error":   fmt.Sprintf("Error opening bookmarks file: %v", err),
		}
	}
	defer bookmarksFile.Close()

	var bookmarksData map[string]interface{}
	decoder := plist.NewDecoder(bookmarksFile)
	err = decoder.Decode(&bookmarksData)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error":   fmt.Sprintf("Error decoding plist: %v", err),
		}
	}

	return map[string]interface{}{
		"success": true,
		"data":    bookmarksData,
	}
}

func main() {
	if err := initLogFile(); err != nil {
		fmt.Fprintf(os.Stderr, "Error initializing log file: %v\n", err)
		return
	}
	defer logFile.Close()
	
	for {
		message, err := getMessage()
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error reading message: %v\n", err)
			break
		}

		if cmd, ok := message["command"].(string); ok && cmd == "getBookmarks" {
			response := readBookmarks()
			if err := sendMessage(response); err != nil {
				fmt.Fprintf(os.Stderr, "Error sending message: %v\n", err)
				break
			}
		}
	}
}