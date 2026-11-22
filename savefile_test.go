package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestSaveBackupRecovery(t *testing.T) {
	path := filepath.Join(t.TempDir(), "arcade-save.json")
	first := []byte(`{"version":1,"coins":8,"tank":{},"walk":{}}`)
	second := []byte(`{"version":1,"coins":16,"tank":{},"walk":{}}`)
	for _, raw := range [][]byte{first, second} {
		if err := storeDiskSave(path, raw); err != nil {
			t.Fatal(err)
		}
		saved, err := readDiskSave(path)
		if err != nil || string(saved) != string(raw) {
			t.Fatalf("read after save = %s, %v", saved, err)
		}
	}
	if err := storeDiskSave(path, []byte("truncated")); err == nil {
		t.Fatal("accepted a truncated save")
	}
	if err := os.WriteFile(path, []byte("{"), 0600); err != nil {
		t.Fatal(err)
	}
	saved, err := readDiskSave(path)
	if err != nil || string(saved) != string(first) {
		t.Fatalf("read after corruption = %s, %v", saved, err)
	}
}
