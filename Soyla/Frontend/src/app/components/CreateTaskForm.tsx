import { useState } from "react";
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

  // Validación del nombre de la tarea
  const validateTaskName = (name: string): string | null => {
    if (!name.trim()) {
      return "El nombre de la tarea es obligatorio";
    }

    // Verificar si solo tiene caracteres especiales (sin letras ni números)
    const onlySpecialChars = /^[^a-zA-Z0-9]+$/.test(name.trim());
    if (onlySpecialChars) {
      return "El nombre de la tarea no puede contener sólo caracteres especiales";
    }

    // Verificar si solo tiene números
    const onlyNumbers = /^[0-9]+$/.test(name.trim());
    if (onlyNumbers) {
      return "El nombre de la tarea no puede contener sólo números";
    }

    return null;
  };

  // Validación de la fecha límite
  const validateDeadline = (deadline: string): string | null => {
    if (!deadline) {
      return "La fecha límite es obligatoria";
    }

    const selectedDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return "La fecha límite no es válida (no puede ser anterior a la fecha actual)";
    }

    return null;
  };

  // Manejo del envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos los campos
    const nameError = validateTaskName(formData.name);
    const deadlineError = validateDeadline(formData.deadline);

    const newErrors: FormErrors = {};
    if (nameError) newErrors.name = nameError;
    if (deadlineError) newErrors.deadline = deadlineError;

    setErrors(newErrors);

    // Si hay errores, no continuar
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Simular tiempo de procesamiento (máximo 3 segundos)
    setIsSubmitting(true);

    // Crear la tarea
    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      groupId: groupId,
      name: formData.name.trim(),
      description: formData.description.trim(),
      deadline: formData.deadline,
      frequency: formData.frequency,
      createdAt: Date.now(),
      status: "pending",
    };

    // Guardar en localStorage
    const existingTasks = JSON.parse(localStorage.getItem("familyTasks") || "[]");
    existingTasks.push(newTask);
    localStorage.setItem("familyTasks", JSON.stringify(existingTasks));

    // Simular envío de notificaciones (indicación visual)
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      setIsOpen(false);

      // Limpiar el formulario
      setFormData({
        name: "",
        description: "",
        deadline: "",
        frequency: "ninguna",
      });

      // Ocultar mensaje de éxito después de 4 segundos
      setTimeout(() => {
        setShowSuccess(false);
        if (onTaskCreated) {
          onTaskCreated();
        }
      }, 4000);
    }, 1500); // Simular 1.5 segundos de procesamiento
  };

  // Obtener la fecha mínima (hoy)
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <>
      {/* Mensaje de éxito */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-white border border-green-200 shadow-lg rounded-lg px-5 py-3 transition-all max-w-md">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">Tarea creada exitosamente</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Se ha notificado a todos los miembros del grupo familiar
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
            {/* Nombre de la tarea */}
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
              {errors.name && (
                <p className="text-sm text-red-600 flex items-start gap-1.5">
                  <span className="inline-block w-1 h-1 bg-red-600 rounded-full mt-1.5"></span>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="taskDescription">
                Descripción
              </Label>
              <Textarea
                id="taskDescription"
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                }}
                placeholder="Describe los detalles de la tarea..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Fecha límite y Frecuencia en columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Fecha límite */}
              <div className="space-y-2">
                <Label htmlFor="taskDeadline">
                  Fecha límite <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="taskDeadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => {
                    setFormData({ ...formData, deadline: e.target.value });
                    if (errors.deadline) {
                      setErrors({ ...errors, deadline: undefined });
                    }
                  }}
                  min={getTodayDate()}
                  className={errors.deadline ? "border-red-500 focus-visible:ring-red-200" : ""}
                  disabled={isSubmitting}
                />
                {errors.deadline && (
                  <p className="text-sm text-red-600 flex items-start gap-1.5">
                    <span className="inline-block w-1 h-1 bg-red-600 rounded-full mt-1.5"></span>
                    {errors.deadline}
                  </p>
                )}
              </div>

              {/* Frecuencia */}
              <div className="space-y-2">
                <Label htmlFor="taskFrequency">
                  Frecuencia <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="taskFrequency">
                    <SelectValue placeholder="Selecciona la frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguna">Ninguna</SelectItem>
                    <SelectItem value="diaria">Diaria</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botón de envío */}
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