package services

import "errors"

var ErrAccountHasTransactions = errors.New("cannot delete account with transactions")
var ErrCategoryHasTransactions = errors.New("cannot delete category that is referenced by transactions, budget allocations, or targets")
