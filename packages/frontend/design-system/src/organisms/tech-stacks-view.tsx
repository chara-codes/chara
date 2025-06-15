"use client";

import type React from "react";
import { useState, useCallback, useMemo } from "react";
import styled from "styled-components";
import ViewNavigation from "../molecules/view-navigation";
import {
  ButtonBase,
  PlusIcon,
  EditIcon,
  CodeIcon,
  ServerIcon,
  DatabaseIcon,
  LayersIcon,
  GlobeIcon,
} from "../atoms";
import type { Theme } from "../theme";
import TechStackDetailView from "./tech-stack-detail-view";
import {
  useNavigateToAddTechStack,
  useNavigateToEditTechStack,
  useNavigateBack,
  TechStackDetail,
} from "@chara/core";
import { useTechStacks } from "@chara/core";
import Tooltip from "../atoms/tooltip";

const iconComponents = {
  code: CodeIcon,
  server: ServerIcon,
  database: DatabaseIcon,
  layers: LayersIcon,
  globe: GlobeIcon,
} as const;

const TechStacksContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: #f9fafb;
`;

const TechStacksContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
`;

const CategorySection = styled.div`
  margin-bottom: 16px;
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 0 4px;
`;

const CategoryTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin: 0;
`;

const CategoryCount = styled.span`
  font-size: 12px;
  color: #6b7280;
  background-color: #f3f4f6;
  padding: 2px 6px;
  border-radius: 10px;
`;

const TechStacksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
`;

const TechStackCard = styled.div<{ $isNew?: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 12px;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  position: relative;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 4px 6px rgba(0, 0, 0, 0.05),
      0 1px 3px rgba(0, 0, 0, 0.1);
  }

  ${(props) =>
    props.$isNew &&
    `
    &::after {
      content: 'NEW';
      position: absolute;
      top: -6px;
      right: -6px;
      background-color: #ec4899;
      color: white;
      font-size: 9px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 10px;
      box-shadow: 0 2px 4px rgba(236, 72, 153, 0.3);
    }
  `}
`;

const TechStackIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #f3f4f6;
  margin-bottom: 8px;
  color: ${({ theme }) => (theme as Theme).colors.primary};
`;

const TechStackName = styled.h4`
  font-size: 13px;
  font-weight: 500;
  color: #111827;
  margin: 0 0 4px 0;
`;

const TechStackDescription = styled.p`
  font-size: 11px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
  flex: 1;
`;

const PopularityBar = styled.div<{ $level: number }>`
  height: 3px;
  background-color: #e5e7eb;
  border-radius: 2px;
  margin-top: 8px;
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${(props) => props.$level * 10}%;
    background-color: ${(props) => {
      if (props.$level >= 8) return "#10b981"; // green for high popularity
      if (props.$level >= 5) return "#3b82f6"; // blue for medium popularity
      return "#6b7280"; // gray for low popularity
    }};
    border-radius: 2px;
  }
`;

const NoResultsMessage = styled.div`
  padding: 24px;
  text-align: center;
  color: #6b7280;
  background-color: white;
  border-radius: 8px;
  margin-top: 12px;
  font-size: 14px;
`;

const EditButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 5;

  ${TechStackCard}:hover & {
    opacity: 1;
  }

  &:hover {
    background-color: #f3f4f6;
    color: #111827;
  }
`;

const AddTechStackButton = styled(ButtonBase)`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const TechStacksView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTechStack, setSelectedTechStack] =
    useState<TechStackDetail | null>(null);

  // Get tech stacks from store
  const techStacks = useTechStacks();

  // Get navigation actions
  const navigateToAddTechStack = useNavigateToAddTechStack();
  const navigateToEditTechStack = useNavigateToEditTechStack();
  const navigateBack = useNavigateBack();

  // Handle search query change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Handle tech stack selection
  const handleSelectTechStack = useCallback((techStack: TechStackDetail) => {
    setSelectedTechStack(techStack);
  }, []);

  // Handle back button in detail view
  const handleBackToList = useCallback(() => {
    setSelectedTechStack(null);
  }, []);

  // Handle add tech stack button
  const handleAddTechStack = useCallback(() => {
    navigateToAddTechStack();
  }, [navigateToAddTechStack]);

  // Handle edit tech stack button
  const handleEditTechStack = useCallback(
    (e: React.MouseEvent, techStack: TechStackDetail) => {
      e.stopPropagation(); // Prevent card click (which would navigate to detail view)
      navigateToEditTechStack(techStack.id);
    },
    [navigateToEditTechStack],
  );

  // Filter tech stacks based on search query
  const filteredTechStacks = useMemo(() => {
    if (searchQuery.trim() === "") {
      return techStacks;
    }

    const query = searchQuery.toLowerCase();
    return techStacks.filter(
      (stack) =>
        stack.name.toLowerCase().includes(query) ||
        stack.description.toLowerCase().includes(query) ||
        stack.category.toLowerCase().includes(query),
    );
  }, [searchQuery, techStacks]);

  // Group tech stacks by category
  const techStacksByCategory = useMemo(() => {
    const grouped: Record<string, TechStackDetail[]> = {};

    for (const stack of filteredTechStacks) {
      if (!grouped[stack.category]) {
        grouped[stack.category] = [];
      }
      grouped[stack.category].push(stack);
    }

    // Sort categories alphabetically
    return Object.keys(grouped)
      .sort()
      .reduce(
        (acc, category) => {
          acc[category] = grouped[category];
          return acc;
        },
        {} as Record<string, TechStackDetail[]>,
      );
  }, [filteredTechStacks]);

  // Create the Add Tech Stack button element
  const addTechStackButton = (
    <Tooltip text="Add Tech Stack" position="bottom">
      <AddTechStackButton
        $variant="primary"
        $size="small"
        onClick={handleAddTechStack}
        style={{
          width: "32px",
          height: "32px",
          padding: "0",
          borderRadius: "6px",
        }}
      >
        <PlusIcon width={16} height={16} />
      </AddTechStackButton>
    </Tooltip>
  );

  // If a tech stack is selected, show the detail view
  if (selectedTechStack) {
    // Find the most up-to-date version of the selected tech stack
    const updatedTechStack =
      techStacks.find((stack) => stack.id === selectedTechStack.id) ||
      selectedTechStack;
    return (
      <TechStackDetailView
        techStack={updatedTechStack}
        onBack={handleBackToList}
      />
    );
  }

  const TechStackIconWrapper: React.FC<{ iconName: string }> = ({
    iconName,
  }) => {
    const IconComponent =
      iconComponents[iconName as keyof typeof iconComponents];

    return (
      <TechStackIcon>
        {IconComponent ? <IconComponent width={20} height={20} /> : null}
      </TechStackIcon>
    );
  };

  // Otherwise, show the list view
  return (
    <TechStacksContainer>
      <ViewNavigation
        onBack={navigateBack}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        placeholder="Search tech stacks..."
        rightElement={addTechStackButton}
      />

      <TechStacksContent>
        {Object.keys(techStacksByCategory).length > 0 ? (
          Object.entries(techStacksByCategory).map(([category, stacks]) => (
            <CategorySection key={category}>
              <CategoryHeader>
                <CategoryTitle>{category}</CategoryTitle>
                <CategoryCount>{stacks.length}</CategoryCount>
              </CategoryHeader>

              <TechStacksGrid>
                {stacks.map((stack) => (
                  <TechStackCard
                    key={stack.id}
                    $isNew={stack.isNew}
                    onClick={() => handleSelectTechStack(stack)}
                  >
                    <EditButton onClick={(e) => handleEditTechStack(e, stack)}>
                      <EditIcon width={14} height={14} />
                    </EditButton>
                    <TechStackIconWrapper iconName={stack.icon} />
                    <TechStackName>{stack.name}</TechStackName>
                    <TechStackDescription>
                      {stack.description}
                    </TechStackDescription>
                    <PopularityBar $level={stack.popularity as number} />
                  </TechStackCard>
                ))}
              </TechStacksGrid>
            </CategorySection>
          ))
        ) : (
          <NoResultsMessage>
            No tech stacks found. Try a different search term or create a new
            tech stack.
          </NoResultsMessage>
        )}
      </TechStacksContent>
    </TechStacksContainer>
  );
};

export default TechStacksView;
