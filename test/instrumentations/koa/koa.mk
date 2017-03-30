target := koa

all = 1.0 1.2 1.4 2.0 2.2
some = 1.4 2.2
one = 1.4

versions := $(call configure_targets,$(one),$(some),$(all))

targets := $(targets) $(target)

# set up as target specific variables to avoid collision in other
# makefiles
test_suite_$(target) : target := $(target)
test_suite_$(target) : versions := $(versions)
test_suite_$(target) : cur_path := $(abspath $(lastword $(MAKEFILE_LIST)))
test_suite_$(target) : cur_dir := $(dir $(cur_path))
test_suite_$(target) : cur_base := $(notdir $(cur_path))
test_suite_$(target) : db_url := pg://localhost/postgres
test_suite_$(target) : errors := 0

# normally all tasks should be phony
.PHONY : before_$(target) \
	$(versions:%=before_version_$(target)_%) \
	$(versions:%=test_$(target)_%) \
	$(versions:%=after_version_$(target)_%) \
	after_$(target) \
	test_suite_$(target)

# 'this should run before the test
before_$(target) : before
	@echo '*---------------*'
	@echo '| koa           |'
	@echo '*---------------*'

# this should run after `before` for each of the version targets
# before the test
$(versions:%=before_version_$(target)_%) : before_$(target)
	@npm i koa@$(subst before_version_$(target)_,,$@)

# run the test for each of the versions
$(versions:%=test_$(target)_%) : test_% : before_version_%
	$(MOCHA) $(addprefix $(cur_dir), *.spec.js) || exit 0;

# this should run before `after` for each of the version targets
# after the test suite
$(versions:%=after_version_$(target)_%) : $(versions:%=test_$(target)_%)

# this should run after the test
after_$(target) : $(versions:%=after_version_$(target)_%)

## this is the whole test suite
test_suite_$(target) : after_$(target)
