# Infrastructure Changelog

All notable infrastructure-relevant changes to this project will be documented in this file.

## 0.16.0

### Added

#### Providers

- `NIM_ENABLED` — enables the NIM Model Serving option in the Deployments section; when both this and `HF_ENABLED` are disabled, the Model Servings tab is hidden
- `HF_ENABLED` — enables the HF Model Serving option in the Deployments section; when both this and `NIM_ENABLED` are disabled, the Model Servings tab is hidden

---

### Changed

#### Configuration Management

- `MCP_REGISTRY_ENABLED` — documented as a preview feature for MCP Registry integration
- `DIAL_EVAL_API_URL` — documented as a preview feature for Evaluation API integration
