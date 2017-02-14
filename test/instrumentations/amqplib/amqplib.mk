target := amqplib

all = 0.3.2 0.4.2 0.5.1
some = 0.3.2 0.4.2 0.5.1
one = 0.4.0

versions := $(call configure_targets,$(one),$(some),$(all))

targets := $(targets) $(target)

# set up as target specific variables to avoid collision in other
# makefiles
test_suite_$(target) : target := $(target)
test_suite_$(target) : versions := $(versions)
test_suite_$(target) : cur_path := $(abspath $(lastword $(MAKEFILE_LIST)))
test_suite_$(target) : cur_dir := $(dir $(cur_path))
test_suite_$(target) : cur_base := $(notdir $(cur_path))
test_suite_$(target) : amqp_url := amqp://localhost
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
	@echo '| amqplib       |'
	@echo '*---------------*'
	@npm i amqplib
	AMQP_URL=$(amqp_url) $(addprefix $(cur_dir), verify.js)

# this should run after `before` for each of the version targets
# before the test
$(versions:%=before_version_$(target)_%) : before_$(target)
	npm i amqplib@$(subst before_version_$(target)_,,$@)


# run the test for each of the versions
$(versions:%=test_$(target)_%) : test_% : before_version_%
	AMQP_URL=$(db_host) $(MOCHA) $(addprefix $(cur_dir), *.spec.js) || exit 0;

# this should run before `after` for each of the version targets
# after the test suite
$(versions:%=after_version_$(target)_%) : $(versions:%=test_$(target)_%)

# this should run after the test
after_$(target) : $(versions:%=after_version_$(target)_%)

## this is the whole test suite
test_suite_$(target) : after_$(target)
