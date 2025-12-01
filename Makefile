.PHONY: clean site

clean:
	@echo "Cleaning site..."
	rm -rf index.html
	rm -rf assets/css assets/js assets/icons

site: clean
	@echo "Building site..."
	go run main.go
