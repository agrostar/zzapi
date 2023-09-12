
# Variable sets

Variable sets files contain variables grouped under the set's name. For example:

```
staging:  # variable set: staging
  username: Tom  # variable: username
  userID: 45
production:
  username: Xi
  userID: 89
```

## Type

Variables can be of any type, even objects and arrays. (unlike Postman or Thunderclient, where they have to be strings). This is especially useful in making comparisons against responses, or even variables for using nested objects within Post bodies.

## Use of Variables

We will follow the makefile convention of variables, restircted to the round brace `()`.

* `$variable` if followed by a non-word character or EOL, unless the $ is preceded by a \
* `$(variable)`, unless the $ is preceded by a \

Variables can be placed in any of the following:

* URL
* Parameter values
* Header values
* Body
* Test values

Of the above, the variable value will be converted to a string before being used in the URL, Parameter values, Header values and Body (if it is a string).

While using as test values, the comparison will do an object deep-comparison if the value being compared and the variable both are objects or arrays. If either of them is a string, the other will be converted to a string using JSON.stringify() for non-scalars and toString() for scalars.

## Merging variable sets

If there are multiple `.zzv` files in a directory, all of them will be loaded and merged such that the result will have the union of all variable sets in each variable set file. Within a variable set, the variable names will be combined. In case the same variable name is used, it will be overwritten. Files will be processed in alphabetical order, so if the order is important, you can use 0-first.zzv, 1-second.zzv etc. as the file names.

The need for multiple files arises solely to support personal values (or secrets) that you don't want to share with your team. Each team member will need to create the personal variable set file themselves, with their own unique credentials. This file is typically not committed to the repository, whereas the common shared variable set file is usually committed along with the bundles in the directory.

## Captured Variables

Variables that are set using the `capture` option of a request are _not_ written back into any of the variable set files. They may overwrite existing variables of the same name loaded from the variable sets during the run session, but they are not saved permanently.

All the hand-edited YAML files are meant to be that way: they will not be touched by runners or document generators.

## Varaiable values as variables

This is not supported. Variables cannot be used in other variables.
