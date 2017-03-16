target := when

all = 1.2 2.0 2.2 2.4 2.6 2.8 2.10 3.0 3.2 3.4
some = 1 2 3
one = 3

versions := $(call configure_targets,$(one),$(some),$(all))

targets := $(targets) $(target)

# set up as target specific variables to avoid collision in other
# makefiles
test_suite_$(target) : target := $(target)
test_suite_$(target) : versions := $(versions)
test_suite_$(target) : cur_path := $(abspath $(lastword $(MAKEFILE_LIST)))
test_suite_$(target) : cur_dir := $(dir $(cur_path))
test_suite_$(target) : cur_base := $(notdir $(cur_path))

# normally all tasks should be phony
.PHONY : before_$(target) \
	$(versions:%=before_version_$(target)_%) \
	$(versions:%=test_$(target)_%) \
	test_suite_$(target)

# this should run before the test
before_$(target) : before
	@echo '*---------------*'
	@echo '| when      	   |'
	@echo '*---------------*'

# this should run after `before` for each of the version targets
# before the test
$(versions:%=before_version_$(target)_%) : before_$(target)
	@npm i when@$(subst before_version_$(target)_,,$@)


# run the test for each of the versions
$(versions:%=test_$(target)_%) : test_% : before_version_%
	@$(MOCHA) $(addprefix $(cur_dir), when.spec.js) || exit 0;

## this is the whole test suite
test_suite_$(target) : $(versions:%=test_$(target)_%)
