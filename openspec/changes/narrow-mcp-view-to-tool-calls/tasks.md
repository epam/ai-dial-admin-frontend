## 1. Narrow the MCP view

- [x] 1.1 Add the tool-call method to the module's constants, with the measurement that motivates
      the narrowing stated where the constant is read.
- [x] 1.2 Filter the MCP view's every request to that method, beside the event-kind clause, so no
      widget can disagree with another about which rows it counts.
- [x] 1.3 Remove the tool-call measure and its KPI card, and name the MCP view's count card for tool
      calls so the figure the removed card carried is still stated.
- [x] 1.4 Unit tests: the clause is present in the MCP view and absent in the LLM view; the card set
      and the count card's name.
- [x] 1.5 Name the MCP view's plain plot and its share chart for tool calls.
- [x] 1.6 Count callers by the principal reference falling back to the anonymized hash, so an
      environment whose client-identity enrichment is not provisioned states a figure rather than
      zero on every card.
