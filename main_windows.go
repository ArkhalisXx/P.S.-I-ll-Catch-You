package main

import (
	"bytes"
	"crypto/rand"
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"runtime"
	"unsafe"

	webview "github.com/jchv/go-webview2"
	"github.com/jchv/go-webview2/webviewloader"
	"golang.org/x/sys/windows"
)

const title = "Paperheart Arcade"

//go:embed index.html style.css arcade.css arcade.js arcade-art.js save.js app.js afterhours-art.js game.js music.js postage.js scenery.js sprites.js night-walk.png Third-Party-Notices.txt
var game embed.FS

func main() {
	runtime.LockOSThread()
	if err := run(); err != nil {
		showError(err.Error())
	}
}

func run() error {
	version, err := webviewloader.GetInstalledVersion()
	if err != nil || version == "" {
		return fmt.Errorf("This game needs Microsoft Edge WebView2 Runtime. Install it from https://aka.ms/webview2 then open the game again.")
	}

	cache, err := os.UserCacheDir()
	if err != nil {
		return fmt.Errorf("Find the game's local storage: %w", err)
	}
	root := filepath.Join(cache, "Paperheart Arcade", "PS Ill Catch You")
	assets := filepath.Join(root, "game")
	if err := unpackGame(assets); err != nil {
		return fmt.Errorf("Prepare the game's local files: %w", err)
	}

	width, height := windowSize()
	view := webview.NewWithOptions(webview.WebViewOptions{
		AutoFocus: true,
		DataPath:  filepath.Join(root, "WebView2"),
		WindowOptions: webview.WindowOptions{
			Title: title, Width: width, Height: height, Center: true,
		},
	})
	if view == nil {
		return fmt.Errorf("Windows couldn't open the game window. Check that Microsoft Edge WebView2 Runtime is installed.")
	}
	defer view.Destroy()

	entry := url.URL{Scheme: "file", Path: "/" + filepath.ToSlash(filepath.Join(assets, "index.html"))}
	if err := bindSave(view, root, entry.String()); err != nil {
		return fmt.Errorf("Prepare arcade save file: %w", err)
	}
	view.Navigate(entry.String())
	view.Run()
	return nil
}

// Use a fixed location so saved chapters stay visible after relaunch or an update.
func unpackGame(dir string) error {
	if err := os.MkdirAll(dir, 0700); err != nil {
		return err
	}
	files, err := game.ReadDir(".")
	if err != nil {
		return err
	}
	for _, file := range files {
		name := file.Name()
		data, err := game.ReadFile(name)
		if err != nil {
			return err
		}
		target := filepath.Join(dir, name)
		if old, err := os.ReadFile(target); err == nil && bytes.Equal(old, data) {
			continue
		}
		if err := writeAsset(target, data); err != nil {
			return err
		}
	}
	return nil
}

func windowSize() (uint, uint) {
	user32 := windows.NewLazySystemDLL("user32.dll")
	metrics := user32.NewProc("GetSystemMetrics")
	width, _, _ := metrics.Call(0)
	height, _, _ := metrics.Call(1)
	if width < 500 || height < 400 {
		return 1000, 720
	}
	return uint(min(width-48, 1120)), uint(min(height-72, 925))
}

func showError(message string) {
	user32 := windows.NewLazySystemDLL("user32.dll")
	messageBox := user32.NewProc("MessageBoxW")
	text, _ := windows.UTF16PtrFromString(message)
	caption, _ := windows.UTF16PtrFromString(title)
	const errorIcon = 0x10
	messageBox.Call(0, uintptr(unsafe.Pointer(text)), uintptr(unsafe.Pointer(caption)), errorIcon)
}

// Authorize the bundled entry page only. The bridge has one fixed save destination.
func bindSave(view webview.WebView, root, entry string) error {
	path := filepath.Join(root, "arcade-save.json")
	ticket := rand.Text()
	disk, err := readDiskSave(path)
	if err != nil {
		return err
	}
	payload, err := json.Marshal(struct {
		Ticket string
		Disk   json.RawMessage
		Entry  string
	}{ticket, disk, entry})
	if err != nil {
		return err
	}
	view.Init("(function(p){const u=new URL(location.href);u.search='';u.hash='';if(u.href===p.Entry){window.arcadeTicket=p.Ticket;window.arcadeDisk=p.Disk}})(" + string(payload) + ")")
	return view.Bind("arcadeWrite", func(auth, raw string) error {
		if auth != ticket {
			return errors.New("invalid arcade save")
		}
		return storeDiskSave(path, []byte(raw))
	})
}
