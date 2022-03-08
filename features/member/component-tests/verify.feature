Feature: Verify member

Scenario: New member is not activated without signup

Given a new prospective member Jock the Crow
When they verify
Then they are not signed up

Scenario: New member is activated after signup and verification

Given a new prospective member Jock the Crow
When they signup 
And they verify
Then they become an active member

