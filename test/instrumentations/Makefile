.PHONY: before test

cur_path := $(abspath $(lastword $(MAKEFILE_LIST)))
cur_dir := $(dir $(cur_path))
cur_base := $(notdir $(cur_path))

# Use this variable for invoking the test runner
export MOCHA := $(shell npm bin)/mocha

# You can have multiple set of target versions tested for each library.
# Obviously we cannot accept a list of concrete versions, because then
# it should be listed for every library. Instead, there are 3 target sets
# all: all versions
# some: important / recent versions
# one: most important version, stable version for smoke test
#
# Default is all, but it can be overriden from the command line
TARGET_VERSIONS?=all
configure_targets = $(if $(filter one,$(TARGET_VERSIONS)),$(1),$(if $(filter some,$(TARGET_VERSIONS)),$(2),)$(if $(filter all,$(TARGET_VERSIONS)),$(3),))

# Every library instrumentation should have a subrecipe in its directory
# containing the target test_suite_<LIBRARY_NAME>
# and should append <LIBRARY_NAME> to the variable `targets`
include $(cur_dir)/*/*.mk

# We have a common package json for every test suite, because it is much more
# fast this way. Of course you could install other dependencies in the test
# suites. This is actually needed for versioning.
before :
	npm i

test : $(targets:%=test_suite_%)

# On best practices for writing a test suite for an instrumentation, please
# see mysql/mysql.mk
