Feature: Modify an existing project with Chara

  As a frontend developer
  I want to make changes to my existing project using Chara
  So that I can quickly implement new features with AI assistance

  Scenario: Developer adds changes to an existing project
    Given I am in my project directory
    When I run the command "chara dev"
    Then a web interface should open in my browser
    When I enter a description of my desired changes in the prompt
    Then the server should analyze my prompt
    And suggest files to modify
    When I approve the suggested changes
    Then the CLI should save the modified files locally
    And the web interface should show the changes in a preview panel
    And my project should include the new changes
