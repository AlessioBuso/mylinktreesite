package main

import (
	"bytes"
	"fmt"
	"html/template"
	"io"
	"log"
	"os"
	"path/filepath"

	"gopagelink/configs"
)

func main() {
	config, err := configs.LoadSiteConfig("config.yml")
	if err != nil {
		log.Fatalf("Error loading config: %v", err)
	}
	if config.Theme == "" {
		config.Theme = "custom"
	}

	if err := generateHTML(config); err != nil {
		log.Fatalf("Error generating HTML: %v", err)
	}

	if err := copyAssets(config.Theme); err != nil {
		log.Fatalf("Error copying assets: %v", err)
	}

	fmt.Println("Site generated successfully!")
}

func generateHTML(config *configs.SiteConfig) error {
	themeFile := fmt.Sprintf("themes/%s/index.html", config.Theme)

	tmpl, err := template.ParseFiles(themeFile)
	if err != nil {
		return err
	}

	outputFile, err := os.Create("index.html")
	if err != nil {
		return err
	}
	defer outputFile.Close()

	type TemplateData struct {
		Config             *configs.SiteConfig
		BackgroundGradient template.CSS
	}

	var bgGrad template.CSS
	if config.Colors.BackgroundGradient != "" {
		bgGrad = template.CSS(config.Colors.BackgroundGradient)
	}
	data := TemplateData{
		Config:             config,
		BackgroundGradient: bgGrad,
	}

	return tmpl.Execute(outputFile, data)
}

func copyAssets(theme string) error {
	if err := os.MkdirAll("assets/css", os.ModePerm); err != nil {
		return fmt.Errorf("failed to create assets/css directory: %w", err)
	}
	if err := os.MkdirAll("assets/js", os.ModePerm); err != nil {
		return fmt.Errorf("failed to create assets/js directory: %w", err)
	}
	if err := os.MkdirAll("assets/icons", os.ModePerm); err != nil {
		return fmt.Errorf("failed to create assets/icons directory: %w", err)
	}
	if err := os.MkdirAll("assets/images", os.ModePerm); err != nil {
		return fmt.Errorf("failed to create assets/images directory: %w", err)
	}

	cssFiles, err := filepath.Glob(fmt.Sprintf("themes/%s/assets/css/*.css", theme))
	if err != nil {
		return fmt.Errorf("failed to list CSS files: %w", err)
	}
	if err := copyFiles(cssFiles, "assets/css"); err != nil {
		return fmt.Errorf("failed to copy css files: %w", err)
	}

	jsFiles, err := filepath.Glob(fmt.Sprintf("themes/%s/assets/js/*.js", theme))
	if err != nil {
		return fmt.Errorf("failed to list JS files: %w", err)
	}
	if err := copyFiles(jsFiles, "assets/js"); err != nil {
		return fmt.Errorf("failed to copy js files: %w", err)
	}

	iconFiles, err := filepath.Glob(fmt.Sprintf("themes/%s/assets/icons/*", theme))
	if err != nil {
		return fmt.Errorf("failed to list icon files: %w", err)
	}
	if err := copyFiles(iconFiles, "assets/icons"); err != nil {
		return fmt.Errorf("failed to copy icon files: %w", err)
	}

	imageFiles, err := filepath.Glob(fmt.Sprintf("themes/%s/assets/images/*", theme))
	if err != nil {
		return fmt.Errorf("failed to list image files: %w", err)
	}
	if err := copyFiles(imageFiles, "assets/images"); err != nil {
		return fmt.Errorf("failed to copy image files: %w", err)
	}

	return nil
}

func copyFiles(files []string, outputDir string) error {
	for _, file := range files {
		data, err := os.ReadFile(file)
		if err != nil {
			return fmt.Errorf("failed to read %s: %w", file, err)
		}

		outputPath := filepath.Join(outputDir, filepath.Base(file))
		outFile, err := os.Create(outputPath)
		if err != nil {
			return fmt.Errorf("failed to create %s: %w", outputPath, err)
		}
		defer outFile.Close()

		if _, err := io.Copy(outFile, bytes.NewReader(data)); err != nil {
			return fmt.Errorf("failed to copy data to %s: %w", outputPath, err)
		}
	}

	return nil
}
