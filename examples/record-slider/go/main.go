// Emit a Foottrace-compatible invoice record using the Go standard library.
package main

import (
	"encoding/json"
	"fmt"
	"os"
)

type write struct {
	Path     string   `json:"path"`
	Verb     string   `json:"verb"`
	ReadKeys []string `json:"readKeys"`
}

type commit struct {
	Stage          string         `json:"stage"`
	StageID        string         `json:"stageId"`
	RuntimeStageID string         `json:"runtimeStageId"`
	Trace          []write        `json:"trace"`
	Overwrite      map[string]int `json:"overwrite"`
	Updates        map[string]int `json:"updates"`
	RedactedPaths  []string       `json:"redactedPaths"`
}

type record struct {
	InitialState map[string]int `json:"initialState"`
	CommitLog    []commit       `json:"commitLog"`
}

func (r *record) calculate(state map[string]int, stage, id, key string, compute func(read func(string) int) int) {
	reads := []string{}
	value := compute(func(k string) int {
		reads = append(reads, k)
		return state[k]
	})
	state[key] = value
	r.CommitLog = append(r.CommitLog, commit{
		Stage: stage, StageID: id, RuntimeStageID: fmt.Sprintf("%s#%d", id, len(r.CommitLog)),
		Trace: []write{{Path: key, Verb: "set", ReadKeys: reads}},
		Overwrite: map[string]int{key: value}, Updates: map[string]int{}, RedactedPaths: []string{},
	})
}

func main() {
	r := record{InitialState: map[string]int{"unitPrice": 10, "quantity": 3, "deliveryFee": 5}}
	state := make(map[string]int)
	for key, value := range r.InitialState {
		state[key] = value
	}
	r.calculate(state, "Subtotal", "subtotal", "subtotal", func(read func(string) int) int {
		return read("unitPrice") * read("quantity")
	})
	r.calculate(state, "Invoice", "invoice", "invoiceTotal", func(read func(string) int) int {
		return read("subtotal") + read("deliveryFee")
	})
	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(r); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
