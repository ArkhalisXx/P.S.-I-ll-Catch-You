package main

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
)

func readDiskSave(path string) (json.RawMessage, error) {
	for _, candidate := range []string{path, path + ".bak"} {
		raw, err := os.ReadFile(candidate)
		if errors.Is(err, os.ErrNotExist) {
			continue
		}
		if err != nil {
			return nil, err
		}
		if validSave(raw) {
			return raw, nil
		}
	}
	return []byte("null"), nil
}

func storeDiskSave(path string, raw []byte) error {
	if !validSave(raw) {
		return errors.New("invalid arcade save")
	}
	old, err := os.ReadFile(path)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	if validSave(old) {
		if err := writeAsset(path+".bak", old); err != nil {
			return err
		}
	}
	return writeAsset(path, raw)
}

func validSave(raw []byte) bool {
	var header struct {
		Version int
		Tank    map[string]any
		Walk    map[string]any
	}
	return len(raw) <= 262144 && json.Unmarshal(raw, &header) == nil && header.Version == 1 && header.Tank != nil && header.Walk != nil
}

func writeAsset(path string, data []byte) error {
	file, err := os.CreateTemp(filepath.Dir(path), ".paperheart-*")
	if err != nil {
		return err
	}
	defer os.Remove(file.Name())
	_, writeErr := file.Write(data)
	closeErr := file.Close()
	if writeErr != nil {
		return writeErr
	}
	if closeErr != nil {
		return closeErr
	}
	return os.Rename(file.Name(), path)
}
