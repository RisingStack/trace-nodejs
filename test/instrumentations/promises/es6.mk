target := es6

versions := latest

targets := $(targets) $(target)

# set up as target specific variables to avoid collision in other
# makefiles
test_suite_$(target) : target := $(target)
test_suite_$(target) : versions := $(versions)
test_suite_$(target) : cur_path := $(abspath $(lastword $(MAKEFILE_LIST)))
test_suite_$(target) : cur_dir := $(dir $(cur_path))
test_suite_$(target) : cur_base := $(notdir $(cur_path))

# normally all tasks should be phony
.PHONY : before_$(target) test_$(target) test_suite_$(target)

# this should run before the test
before_$(target) : before
	@echo '*---------------*'
	@echo '| es6           |'
	@echo '*---------------*'

# run the test for each of the versions
test_$(target) : before_$(target)
	@$(MOCHA) $(addprefix $(cur_dir), es6.spec.js) || exit 0;

## this is the whole test suite
test_suite_$(target) : test_$(target)
