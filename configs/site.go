package configs

import (
	"os"

	"gopkg.in/yaml.v2"
)

// SiteConfig mirrors config.yml content.
type SiteConfig struct {
	Name    string `yaml:"name"`
	Bio     string `yaml:"bio"`
	Picture string `yaml:"picture"`
	Logo    string `yaml:"logo"`
	Font    string `yaml:"font"`
	FontURL string `yaml:"fontUrl"`
	Meta    Meta   `yaml:"meta"`
	Links   []Link `yaml:"links"`
	Colors  Colors `yaml:"colors"`
	Socials []Social `yaml:"socials"`
	Theme   string `yaml:"theme"`
}

type Meta struct {
	Title       string `yaml:"title"`
	Description string `yaml:"description"`
	Lang        string `yaml:"lang"`
	Author      string `yaml:"author"`
	SiteURL     string `yaml:"siteUrl"`
}

type Link struct {
	Name string `yaml:"name"`
	URL  string `yaml:"url"`
}

type Colors struct {
	Background     string `yaml:"background"`
	BackgroundGradient string `yaml:"backgroundGradient"`
	Text           string `yaml:"text"`
	LinkBackground string `yaml:"linkBackground"`
	LinkText       string `yaml:"linkText"`
	LinkBorder     string `yaml:"linkBorder"`
	Bio            string `yaml:"bio"`
	HoverBackground string `yaml:"hoverBackground"`
	HoverText       string `yaml:"hoverText"`
	HeaderGradient string `yaml:"headerGradient"`
	HeroBackground string `yaml:"heroBackground"`
	MainBackground string `yaml:"mainBackground"`
	SectionBorder  string `yaml:"sectionBorder"`
	SectionText    string `yaml:"sectionText"`
}

type Social struct {
	Name string `yaml:"name"`
	URL  string `yaml:"url"`
	Icon string `yaml:"icon"`
}

// LoadSiteConfig reads and unmarshals the config file.
func LoadSiteConfig(path string) (*SiteConfig, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var config SiteConfig
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, err
	}

	return &config, nil
}
