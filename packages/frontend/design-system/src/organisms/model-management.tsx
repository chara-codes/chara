"use client";

import type React from "react";
import { useState } from "react";
import styled from "styled-components";
import ModelList from "../molecules/model-list";
import { ButtonBase, SelectBase } from "../atoms/form-elements";

const ManagementContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 20px;
`;

const ControlsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #e5e7eb;
`;

const ViewControls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const ControlLabel = styled.label`
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
`;

const ActionControls = styled.div`
  display: flex;
  gap: 12px;
`;

const InfoBanner = styled.div`
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;
`;

const InfoTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: #1e40af;
  margin: 0 0 4px 0;
`;

const InfoText = styled.p`
  font-size: 13px;
  color: #1e40af;
  margin: 0;
  line-height: 1.4;
`;

type GroupByOption = 'provider' | 'status' | 'none';

const ModelManagement: React.FC = () => {
  const [groupBy, setGroupBy] = useState<GroupByOption>('provider');

  return (
    <ManagementContainer>
      <InfoBanner>
        <InfoTitle>Model Management</InfoTitle>
        <InfoText>
          Enable or disable AI models to control which ones are available in your conversations. 
          Models can only be enabled if their provider is configured and enabled.
        </InfoText>
      </InfoBanner>

      <ControlsBar>
        <ViewControls>
          <ControlLabel htmlFor="group-by">Group by:</ControlLabel>
          <SelectBase
            id="group-by"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
          >
            <option value="provider">Provider</option>
            <option value="status">Status</option>
            <option value="none">None</option>
          </SelectBase>
        </ViewControls>

        <ActionControls>
          <ButtonBase
            $variant="secondary"
            $size="small"
            onClick={() => window.location.reload()}
          >
            Refresh Models
          </ButtonBase>
        </ActionControls>
      </ControlsBar>

      <ModelList groupBy={groupBy} />
    </ManagementContainer>
  );
};

export default ModelManagement;