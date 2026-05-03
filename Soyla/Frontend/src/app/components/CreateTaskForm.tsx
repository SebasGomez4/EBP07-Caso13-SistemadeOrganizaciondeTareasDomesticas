import { useState, type FormEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { ClipboardList, CheckCircle2, Loader2 } from "lucide-react";
import { ApiError, createTask } from "../lib/api";

interface CreateTaskFormProps {
  groupId: string;
  onTaskCreated?: () => void;
}

interface TaskFormData {
  name: string;
  description: string;
  deadline: string;
  frequency: string;
}

interface FormErrors {
  name?: string;
  deadline?: string;
}

export function CreateTaskForm({ groupId, onTaskCreated }: CreateTaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    name: "",
    description: "",
    deadline: "",
    frequency: "ninguna",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const validateTaskName = (name: string): string | null => {
    if (!name.trim()) return "El nombre de la tarea es obligatorio";
    if (/^[^a-zA-Z0-9]+$/.test(name.trim())) return "El nombre de la tarea no puede contener solo caracteres especiales";
    if (/^[0-9]+$/.test(name.trim())) return "El nombre de la tarea no puede contener solo numeros";
    return null;
  };

  const validateDeadline = (deadline: string, frequency: string): string | null => {
    if (frequency !== "ninguna") return null;
    if (!deadline) return "La fecha limite es obligatoria";

    const selectedDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return "La fecha limite no es valida";
    }

    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const nameError = validateTaskName(formData.name);
    const deadlineError = validateDeadline(formData.deadline, formData.frequency);

    const newErrors: FormErrors = {};
    if (nameError) newErrors.name = nameError;
    if (deadlineError) newErrors.deadline = deadlineError;
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createTask(groupId, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        deadline: formData.frequency === "ninguna" ? formData.deadline : undefined,
        frequency: formData.frequency,
      });

      setShowSuccess(true);
      setIsOpen(false);
      setFormData({
        name: "",
        description: "",
        deadline: "",
        frequency: "ninguna",
      });

      if (onTaskCreated) {
        onTaskCreated();
      }

      window.setTimeout(() => setShowSuccess(false), 4000);
    } catch (caughtError) {
      const message = caughtError instanceof ApiError
        ? caughtError.message
        : "No fue posible crear la tarea.";

      if (message.toLowerCase().includes("fecha")) {
        setErrors((prev) => ({ ...prev, deadline: message }));
      } else {
        setErrors((prev) => ({ ...prev, name: message }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <>
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-green-200 shadow-lg rounded-lg px-5 py-3 transition-all max-w-md">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">Tarea creada exitosamente</p>
            <p className="text-xs text-gray-600 mt-0.5">
              La tarea ya esta disponible para todos los miembros del grupo
            </p>
          </div>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex items-center gap-2"
            size="lg"
          >
            <ClipboardList className="h-5 w-5" />
            Crear tarea
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="h-4 w-4 text-purple-600" />
              </div>
              Nueva tarea
            </DialogTitle>
            <DialogDescription>
              Organiza las responsabilidades del hogar entre los miembros del grupo
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="taskName">
                Nombre de la tarea <span className="text-red-500">*</span>
              </Label>
              <Input
                id="taskName"
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) {
                    setErrors({ ...errors, name: undefined });
                  }
                }}
                placeholder="Ej: Lavar la ropa"
                className={errors.name ? "border-red-500 focus-visible:ring-red-200" : ""}
                disabled={isSubmitting}
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="taskDescription">Descripcion</Label>
              <Textarea
                id="taskDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe los detalles de la tarea..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="taskDeadline">
                  Fecha limite {formData.frequency === "ninguna" && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="taskDeadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => {
                    const newDeadline = e.target.value;
                    setFormData({
                      ...formData,
                      deadline: newDeadline,
                      frequency: newDeadline ? "ninguna" : formData.frequency,
                    });
                    if (errors.deadline) {
                      setErrors({ ...errors, deadline: undefined });
                    }
                  }}
                  min={getTodayDate()}
                  className={errors.deadline ? "border-red-500 focus-visible:ring-red-200" : ""}
                  disabled={isSubmitting || formData.frequency !== "ninguna"}
                />
                {formData.frequency !== "ninguna" && (
                  <p className="text-xs text-gray-500 mt-1">No disponible cuando se define frecuencia</p>
                )}
                {errors.deadline && <p className="text-sm text-red-600">{errors.deadline}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="taskFrequency">
                  Frecuencia <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      frequency: value,
                      deadline: value !== "ninguna" ? "" : formData.deadline,
                    });
                    if (errors.deadline && value !== "ninguna") {
                      setErrors({ ...errors, deadline: undefined });
                    }
                  }}
                  disabled={isSubmitting || formData.deadline !== ""}
                >
                  <SelectTrigger id="taskFrequency">
                    <SelectValue placeholder="Selecciona la frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguna">Ninguna</SelectItem>
                    <SelectItem value="diaria" disabled={formData.deadline !== ""}>Diaria</SelectItem>
                    <SelectItem value="semanal" disabled={formData.deadline !== ""}>Semanal</SelectItem>
                    <SelectItem value="mensual" disabled={formData.deadline !== ""}>Mensual</SelectItem>
                  </SelectContent>
                </Select>
                {formData.deadline !== "" && (
                  <p className="text-xs text-gray-500 mt-1">No disponible cuando se define fecha limite</p>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando tarea...
                  </>
                ) : (
                  <>
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Crear tarea
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
