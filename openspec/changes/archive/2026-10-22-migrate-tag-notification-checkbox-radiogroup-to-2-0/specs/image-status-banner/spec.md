## MODIFIED Requirements

### Requirement: Banner is rendered only on the Container view's Properties tab

`Containers/View/TabsContent.tsx` SHALL render `<ImageStatusBanner image={image} />` inside the `activeTab === EntityViewTab.Properties` branch only, positioned **above** `<PropertiesTabContent>` (which is the component that renders `EntityInfoHeader`). The previous inline `Notification` implementation SHALL be removed.

#### Scenario: ImageStatusBanner appears in Properties branch only

- **WHEN** `Containers/View/TabsContent.tsx` is read
- **THEN** `<ImageStatusBanner>` SHALL appear inside the `activeTab === EntityViewTab.Properties` block
- **AND** SHALL appear before `<PropertiesTabContent>` in DOM order

#### Scenario: Other tabs do not render ImageStatusBanner

- **WHEN** the active tab is any value other than `EntityViewTab.Properties` (Tools, Resources, Prompts, Metrics, ExecutionLog, Events, Firewall)
- **THEN** `<ImageStatusBanner>` SHALL NOT be rendered

#### Scenario: Inline Notification is removed from TabsContent

- **WHEN** `Containers/View/TabsContent.tsx` is read after the change
- **THEN** the file SHALL NOT contain a direct `Notification` import or render related to image-not-installed
- **AND** SHALL NOT contain the previous custom CSS overrides (`[&>div]:flex-1 [&>div>div:last-child]:w-full`) for the image-not-installed alert

