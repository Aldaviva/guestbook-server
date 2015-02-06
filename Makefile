RESTDOWN := restdown

all: doc

doc: doc/index.html

doc/index.html: doc/index.restdown
	@$(RESTDOWN) -q -b doc doc/index.restdown

clean:
	@rm -rf doc/index.html
