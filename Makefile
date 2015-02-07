RESTDOWN := restdown
JSL := jsl
MOCHA := node_modules/mocha/bin/mocha
NODE:= node

TEST_REPORTER := nyan

all: doc

doc: doc/index.html

doc/index.html: doc/index.restdown
	@$(RESTDOWN) -q -b doc doc/index.restdown

clean:
	@rm -rf doc/index.html

.PHONY: lint
lint:
	@find lib -name "*.js" | xargs $(JSL) --conf=tools/jsl.conf --nofilelisting --nologo --nosummary *.js

.PHONY: test
test: lint
	@if [ -d ".pid" ]; then cat .pid | xargs kill -INT; fi; exit 0

	@rm -rf test/tempData .pid
	@$(NODE) $(MOCHA) --reporter $(TEST_REPORTER) --bail --slow 1000 test/suites
	@rm -rf test/tempData .pid
