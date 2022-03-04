
Feature: Member signup

Scenario: New member can successfully sign up

Given a new prospective member Sally Cinnamon
When they signup
Then their signup request is approved

Scenario: New member cannot sign up without correct details
Given a member Roger Ramjet with invalid details
When they signup
Then their signup request is rejected as it was invalid

Scenario: Existing member cannot re-sign up

Given an existing member Tom Thumb
When they signup
Then their signup request is rejected as they are already a member


