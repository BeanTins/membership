Feature: Verify member

Scenario: New member is not activated without verify

Given a new prospective member Jock the Crow
When they signup
Then they are an inactive member

Scenario: New member is activated after signup and verification

Given a new prospective member Jock the Crow
When they signup 
And they verify
Then they become an active member

