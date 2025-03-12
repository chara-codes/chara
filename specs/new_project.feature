Feature: Create a new project with Chara

  As a frontend developer
  I want to create a new project quickly using Chara
  So that I can start development with an AI-assisted setup

  Scenario: Developer creates a new project
    Given I am in an empty directory
    When I run the command "chara dev"
    Then a web interface should open in my browser
    When I enter a project description in the prompt
    Then the server should analyze my prompt
    And suggest commands to execute for project setup
    When I approve the suggested commands
    Then the CLI should execute these commands
    And the server should return a list of files to create
    When the CLI saves these files locally
    Then the web interface should show the changes in a preview panel
    And my new project should be ready for development
