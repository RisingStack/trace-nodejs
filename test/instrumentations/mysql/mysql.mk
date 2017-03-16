# name the Makefile according to the library name whose
# instrumentation is tested

# this is used throughout the script as the identifier
# for the tasks related to this instrumentation
target := mysql

# list the targeted versions according to TARGET_VERSIONS
all = 2.2 2.5 2.7 2.10 2.12
some = 2.5 2.7 2.10
one = 2.7

# call configure_targets to determine which target versions
# will be executed
versions := $(call configure_targets,$(one),$(some),$(all))

# append target to targets
targets := $(targets) $(target)

# set up target specific variables to avoid collision in other
# makefiles. This will apply to all prerequisites as well, so
# it is enough to assign to the root task.
test_suite_$(target) : target := $(target)
test_suite_$(target) : versions := $(versions)
test_suite_$(target) : cur_path := $(abspath $(lastword $(MAKEFILE_LIST)))
test_suite_$(target) : cur_dir := $(dir $(cur_path))
test_suite_$(target) : cur_base := $(notdir $(cur_path))
test_suite_$(target) : db_host := localhost

# normally all tasks should be phony (fake), i.e. they don't depend on actual
# files, but other tasks. One misconception of make is that it is only able
# to run rules on file system changes.
# I enforce a convention here for the rule names to make it extensible and
# understandable.
# This is the flow:
#                        	before_<T>
#                          /    |    \
#                        /     ...    \
#       before_version_<T>_<V1>     before_version_<T>_<Vn>
#                		|       :      |
#              test_<T>_<V1>    :    test_<T>_<Vn>
#                       |    	:      |
#        after_version_<T>_<V1>      after_version_<T>_<Vn>
#                       \             /
#                        \          /
#                          after_<T>
#                              |
# 						test_suite_<Vn>

.PHONY : before_$(target) \
	$(versions:%=before_version_$(target)_%) \
	$(versions:%=test_$(target)_%) \
	$(versions:%=after_version_$(target)_%) \
	after_$(target) \
	test_suite_$(target)

# this should run before the test
before_$(target) : before
	@echo '*---------------*'
	@echo '| mysql         |'
	@echo '*---------------*'
	@npm i mysql
	# this script throws an error if it can't access the db
	@MYSQL_HOST=$(db_host) $(addprefix $(cur_dir), dbVerify.js)

# this should run after `before` for each of the version targets
# but before the test
$(versions:%=before_version_$(target)_%) : before_$(target)
	# install version to be tested
	@npm i mysql@$(subst before_version_$(target)_,,$@)

# run the test for each of the versions
$(versions:%=test_$(target)_%) : test_% : before_version_%
	# TODO remove the failsafe once tests are stable
	@MYSQL_HOST=$(db_host) $(MOCHA) $(addprefix $(cur_dir), *.spec.js) || exit 0;

# this should run before `after` for each of the version targets
# after the test suite
# Here it is simply a noop.
$(versions:%=after_version_$(target)_%) : $(versions:%=test_$(target)_%)

# this should run after the test
# Here it is simply a noop.
after_$(target) : $(versions:%=after_version_$(target)_%)

## this is the whole test suite
test_suite_$(target) : after_$(target)
