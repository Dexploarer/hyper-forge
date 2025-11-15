/**
 * EditDialogueModal Component
 * Modal for editing Dialogue content
 */

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalSection,
  Button,
  Input,
  Textarea,
} from "../common";
import { useContent } from "@/hooks/useContent";
import { useContentEditForm } from "@/hooks/useContentEditForm";
import { EditModalFooter } from "./EditModalFooter";

interface EditDialogueModalProps {
  open: boolean;
  onClose: () => void;
  dialogue: any;
}

interface DialogueResponse {
  text: string;
  nextNodeId?: string;
}

interface DialogueNode {
  id: string;
  text: string;
  responses?: DialogueResponse[];
}

interface DialogueFormData {
  npcName: string;
  context: string;
  nodes: DialogueNode[];
}

export const EditDialogueModal: React.FC<EditDialogueModalProps> = ({
  open,
  onClose,
  dialogue,
}) => {
  const { updateDialogue } = useContent();

  const { formData, setFormData, isSaving, handleSave, isValid } =
    useContentEditForm<DialogueFormData, any>({
      initialData: dialogue,
      open,
      onUpdate: updateDialogue,
      onClose,
      validator: (data) => data.nodes.length > 0,
      transformer: (data) => ({
        npcName: data.npcName,
        context: data.context,
        nodes: data.nodes,
      }),
      initializer: (dialogue) => ({
        npcName: dialogue.npcName || "",
        context: dialogue.context || "",
        nodes: Array.isArray(dialogue.nodes) ? dialogue.nodes : [],
      }),
    });

  const addNode = () => {
    const newNodeId = `node_${Date.now()}`;
    setFormData({
      ...formData,
      nodes: [...formData.nodes, { id: newNodeId, text: "", responses: [] }],
    });
  };

  const removeNode = (index: number) => {
    setFormData({
      ...formData,
      nodes: formData.nodes.filter((_, i) => i !== index),
    });
  };

  const updateNode = (index: number, field: keyof DialogueNode, value: any) => {
    const updated = [...formData.nodes];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, nodes: updated });
  };

  const addResponse = (nodeIndex: number) => {
    const updated = [...formData.nodes];
    const responses = updated[nodeIndex].responses || [];
    updated[nodeIndex].responses = [
      ...responses,
      { text: "", nextNodeId: undefined },
    ];
    setFormData({ ...formData, nodes: updated });
  };

  const removeResponse = (nodeIndex: number, responseIndex: number) => {
    const updated = [...formData.nodes];
    updated[nodeIndex].responses = updated[nodeIndex].responses?.filter(
      (_, i) => i !== responseIndex,
    );
    setFormData({ ...formData, nodes: updated });
  };

  const updateResponse = (
    nodeIndex: number,
    responseIndex: number,
    field: keyof DialogueResponse,
    value: any,
  ) => {
    const updated = [...formData.nodes];
    const responses = updated[nodeIndex].responses || [];
    responses[responseIndex] = { ...responses[responseIndex], [field]: value };
    updated[nodeIndex].responses = responses;
    setFormData({ ...formData, nodes: updated });
  };

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <ModalHeader title="Edit Dialogue" onClose={onClose} />

      <ModalBody>
        <div className="space-y-6">
          <ModalSection title="Dialogue Information">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  NPC Name
                </label>
                <Input
                  type="text"
                  value={formData.npcName}
                  onChange={(e) =>
                    setFormData({ ...formData, npcName: e.target.value })
                  }
                  placeholder="Character speaking these lines"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Context
                </label>
                <Textarea
                  value={formData.context}
                  onChange={(e) =>
                    setFormData({ ...formData, context: e.target.value })
                  }
                  placeholder="When/where this dialogue occurs"
                  className="w-full min-h-[60px]"
                />
              </div>
            </div>
          </ModalSection>

          <ModalSection title="Dialogue Nodes">
            <div className="space-y-4">
              {formData.nodes.map((node, nodeIndex) => (
                <div
                  key={node.id}
                  className="p-4 bg-bg-tertiary/30 border border-border-primary rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-text-primary">
                      Node: {node.id}
                    </h4>
                    <button
                      onClick={() => removeNode(nodeIndex)}
                      className="p-1 hover:bg-red-500/10 rounded text-text-tertiary hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Node ID
                    </label>
                    <Input
                      type="text"
                      value={node.id}
                      onChange={(e) =>
                        updateNode(nodeIndex, "id", e.target.value)
                      }
                      placeholder="Unique node identifier"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Text
                    </label>
                    <Textarea
                      value={node.text}
                      onChange={(e) =>
                        updateNode(nodeIndex, "text", e.target.value)
                      }
                      placeholder="What the character says at this node"
                      className="w-full min-h-[60px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-text-secondary">
                        Player Responses
                      </label>
                      <button
                        onClick={() => addResponse(nodeIndex)}
                        className="text-xs text-primary hover:text-primary/80"
                      >
                        + Add Response
                      </button>
                    </div>

                    {node.responses?.map((response, responseIndex) => (
                      <div
                        key={responseIndex}
                        className="p-3 bg-bg-secondary/50 border border-border-primary/30 rounded space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-text-tertiary">
                            Response {responseIndex + 1}
                          </span>
                          <button
                            onClick={() =>
                              removeResponse(nodeIndex, responseIndex)
                            }
                            className="p-0.5 hover:bg-red-500/10 rounded text-text-tertiary hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-text-tertiary mb-1">
                            Response Text
                          </label>
                          <Input
                            type="text"
                            value={response.text}
                            onChange={(e) =>
                              updateResponse(
                                nodeIndex,
                                responseIndex,
                                "text",
                                e.target.value,
                              )
                            }
                            placeholder="What the player can say"
                            className="w-full text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-text-tertiary mb-1">
                            Next Node ID (optional)
                          </label>
                          <Input
                            type="text"
                            value={response.nextNodeId || ""}
                            onChange={(e) =>
                              updateResponse(
                                nodeIndex,
                                responseIndex,
                                "nextNodeId",
                                e.target.value || undefined,
                              )
                            }
                            placeholder="ID of the node to go to next"
                            className="w-full text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <Button variant="secondary" onClick={addNode} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Dialogue Node
              </Button>
            </div>
          </ModalSection>
        </div>
      </ModalBody>

      <EditModalFooter
        onClose={onClose}
        onSave={handleSave}
        isSaving={isSaving}
        isValid={isValid}
      />
    </Modal>
  );
};
