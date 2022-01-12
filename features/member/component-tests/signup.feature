
Feature: Member signup

Scenario: New member can successfully sign up

Given I am not registered
When I enter my name as Bob
And I enter my email as "Bob@gmail.com"
And I signup
Then I receive a 201 response code

Scenario: New member cannot sign up without an email

Given I am not registered
When I enter my name as Johab
And I signup
Then I receive a 400 response code
And I receive the message "no email specified for signup"
