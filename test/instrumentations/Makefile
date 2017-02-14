.PHONY: before test

cur_path := $(abspath $(lastword $(MAKEFILE_LIST)))
cur_dir := $(dir $(cur_path))
cur_base := $(notdir $(cur_path))

export PATH := $(shell npm bin):$(PATH)

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
TARGET_VERSIONS ?= all
configure_targets = $(if $(filter one,$(TARGET_VERSIONS)),$(1),$(if $(filter some,$(TARGET_VERSIONS)),$(2),)$(if $(filter all,$(TARGET_VERSIONS)),$(3),))

# Every library instrumentation should have a subrecipe in its directory
# containing the target test_suite_<LIBRARY_NAME>
# and should append <LIBRARY_NAME> to the variable `targets`
ifndef TARGET_LIBRARIES
	include $(cur_dir)/*/*.mk
else
	include $(patsubst %, $(cur_dir)/%/*.mk, $(TARGET_LIBRARIES))
endif

# Used for running tests in parallel if possible which will speed up the job on
# CircleCI.
NODE_INDEX ?= 0
NODE_TOTAL ?= 1

# We have a common package json for every test suite, because it is faster
# this way. Of course you could install other dependencies in the test suites.
# This is actually needed for versioning.
before :
	@node --version
	@npm --version
	npm i

test : $(shell $(cur_dir)/distribute-tasks.py $(NODE_INDEX) $(NODE_TOTAL) $(targets:%=test_suite_%))

# On best practices for writing a test suite for an instrumentation, please
# see mysql/mysql.mk
