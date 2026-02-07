package handlers

import (
	"regexp"
	"time"
)

var validAccountTypes = map[string]bool{"checking": true, "savings": true, "credit": true, "cash": true}
var validTxnTypes = map[string]bool{"income": true, "expense": true}
var colourRegex = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)

func validateAccountType(t string) bool { return validAccountTypes[t] }
func validateTxnType(t string) bool     { return validTxnTypes[t] }
func validateColour(c string) bool      { return colourRegex.MatchString(c) }
func validateDate(d string) bool        { _, err := time.Parse("2006-01-02", d); return err == nil }

var monthRegex = regexp.MustCompile(`^\d{4}-(0[1-9]|1[0-2])$`)

func validateMonth(m string) bool { return monthRegex.MatchString(m) }
