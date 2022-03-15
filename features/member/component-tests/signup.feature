
Feature: Member signup

Scenario: New member can successfully sign up

Given a new prospective member Sally Cinnamon
When they signup
Then their signup request is approved

Scenario: New member cannot sign up with missing details
Given a member Roger Ramjet with missing details
When they signup
Then their signup request is rejected

Scenario: New member cannot sign up with invalid details
Given a member Roger Ramjet with invalid details
When they signup
Then their signup request is rejected

Scenario: Existing member cannot re-sign up

Given an existing member Tom Thumb
When they signup
Then their signup request is rejected as they are already a member


