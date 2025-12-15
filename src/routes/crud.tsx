import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  AiOutlineEdit,
  AiOutlineDelete,
  AiOutlinePlus,
  AiOutlineClose,
  AiOutlineCheck,
  AiOutlineWarning,
} from "react-icons/ai";
import {
  getAllData,
  postDataToFirestore,
  updateDataByYear,
  deleteDataByYear,
  getCategories,
} from "../api/baseService";
import { DashboardCard } from "../components/DashboardCard";
import { FilterSelect } from "../components/FilterSelect";
import { ErrorAlert } from "../components/ErrorAlert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/crud")({
  component: CRUDPage,
});

type DataCollection =
  | "emigrantData_destination"
  | "emigrantData_age"
  | "emigrantData_sex"
  | "emigrantData_civilStatus"
  | "emigrantData_education"
  | "emigrantData_occupation"
  | "emigrantData_province";

interface DataRow {
  Year: number;
  [key: string]: any;
}

function CRUDPage() {
  const [selectedCollection, setSelectedCollection] =
    useState<DataCollection>("emigrantData_destination");
  const [data, setData] = useState<DataRow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<DataRow | null>(null);

  // Form states
  const [formYear, setFormYear] = useState<number>(new Date().getFullYear());
  const [formData, setFormData] = useState<Record<string, number>>({});

  const collections: { value: DataCollection; label: string }[] = [
    { value: "emigrantData_destination", label: "Destination Countries" },
    { value: "emigrantData_age", label: "Age Groups" },
    { value: "emigrantData_sex", label: "Gender/Sex" },
    { value: "emigrantData_civilStatus", label: "Civil Status" },
    { value: "emigrantData_education", label: "Education Level" },
    { value: "emigrantData_occupation", label: "Occupation" },
    { value: "emigrantData_province", label: "Province/Origin" },
  ];

  useEffect(() => {
    loadData();
  }, [selectedCollection]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const result = await getAllData(selectedCollection);
      setData(result);

      if (result.length > 0) {
        const cats = await getCategories(selectedCollection);
        setCategories(cats.filter((c) => c !== "Year"));
      } else {
        setCategories([]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setError("");
    setSuccess("");
    try {
      if (!formYear || formYear < 1900 || formYear > 2100) {
        throw new Error("Please enter a valid year");
      }

      if (Object.keys(formData).length === 0) {
        throw new Error("Please add at least one category with a value");
      }

      // Check if year already exists
      if (data.some((row) => row.Year === formYear)) {
        throw new Error(
          `Year ${formYear} already exists. Use Edit instead.`
        );
      }

      await postDataToFirestore(selectedCollection, formYear, formData);
      setSuccess(`Successfully created record for year ${formYear}`);
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create record"
      );
    }
  };

  const handleUpdate = async () => {
    setError("");
    setSuccess("");
    try {
      if (!selectedRow) return;

      if (Object.keys(formData).length === 0) {
        throw new Error("Please provide at least one value to update");
      }

      await updateDataByYear(selectedCollection, selectedRow.Year, formData);
      setSuccess(`Successfully updated record for year ${selectedRow.Year}`);
      setShowEditModal(false);
      resetForm();
      loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update record"
      );
    }
  };

  const handleDelete = async () => {
    setError("");
    setSuccess("");
    try {
      if (!selectedRow) return;

      await deleteDataByYear(selectedCollection, selectedRow.Year);
      setSuccess(`Successfully deleted record for year ${selectedRow.Year}`);
      setShowDeleteModal(false);
      setSelectedRow(null);
      loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete record"
      );
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (row: DataRow) => {
    setSelectedRow(row);
    setFormYear(row.Year);
    const rowData: Record<string, number> = {};
    Object.entries(row).forEach(([key, value]) => {
      if (key !== "Year" && typeof value === "number") {
        rowData[key] = value;
      } else if (key !== "Year" && typeof value === "object" && value?.emigrants) {
        rowData[key] = value.emigrants;
      }
    });
    setFormData(rowData);
    setShowEditModal(true);
  };

  const openDeleteModal = (row: DataRow) => {
    setSelectedRow(row);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormYear(new Date().getFullYear());
    setFormData({});
    setSelectedRow(null);
  };

  const addCategory = () => {
    const categoryName = prompt("Enter category name:");
    if (categoryName && categoryName.trim()) {
      setFormData({ ...formData, [categoryName.trim().toUpperCase()]: 0 });
    }
  };

  const updateCategory = (key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFormData({ ...formData, [key]: numValue });
    }
  };

  const removeCategory = (key: string) => {
    const newData = { ...formData };
    delete newData[key];
    setFormData(newData);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Data Management (CRUD)
        </h1>
        <p className="text-muted-foreground">
          Create, Read, Update, and Delete emigrant data records
        </p>
      </div>

      {/* Status Messages */}
      {error && <ErrorAlert title="Error" message={error} />}

      {success && (
        <div className="bg-green-500/15 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
          <AiOutlineCheck className="text-green-600 dark:text-green-400 text-2xl flex-shrink-0" />
          <p className="text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Controls */}
      <DashboardCard>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <FilterSelect
              label="Select Data Collection"
              value={selectedCollection}
              onChange={(val) => setSelectedCollection(val as DataCollection)}
              options={collections}
              className="w-full md:w-96"
            />
          </div>

          <Button onClick={openCreateModal} className="mt-6 md:mt-0">
            <AiOutlinePlus className="mr-2 h-4 w-4" />
            Create New Record
          </Button>
        </div>
      </DashboardCard>

      {/* Data Table */}
      <DashboardCard title="Data Records" className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            Loading data...
          </div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground text-lg mb-2">No data available</p>
            <p className="text-muted-foreground text-sm">
              Create a new record to get started
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  {categories.slice(0, 5).map((cat) => (
                    <TableHead key={cat}>{cat}</TableHead>
                  ))}
                  {categories.length > 5 && (
                    <TableHead>... +{categories.length - 5} more</TableHead>
                  )}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.Year}>
                    <TableCell className="font-medium">{row.Year}</TableCell>
                    {categories.slice(0, 5).map((cat) => {
                      const value =
                        typeof row[cat] === "object" && row[cat]?.emigrants
                          ? row[cat].emigrants
                          : row[cat];
                      return (
                        <TableCell key={cat}>
                          {typeof value === "number"
                            ? value.toLocaleString()
                            : "-"}
                        </TableCell>
                      );
                    })}
                    {categories.length > 5 && (
                      <TableCell className="text-muted-foreground italic">
                        {categories.length - 5} more fields
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditModal(row)}
                          title="Edit"
                        >
                          <AiOutlineEdit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => openDeleteModal(row)}
                          title="Delete"
                        >
                          <AiOutlineDelete className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {data.length > 0 && (
          <div className="mt-4 text-muted-foreground text-sm">
            Showing {data.length} record{data.length !== 1 ? "s" : ""}
          </div>
        )}
      </DashboardCard>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Record</DialogTitle>
            <DialogDescription>
              Add a new data record for a specific year.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-year">Year *</Label>
              <Input
                id="create-year"
                type="number"
                value={formYear}
                onChange={(e) => setFormYear(parseInt(e.target.value))}
                placeholder="e.g., 2024"
                min="1900"
                max="2100"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Data Fields</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addCategory}
                  className="text-primary h-8"
                >
                  <AiOutlinePlus className="mr-1 h-3 w-3" /> Add Field
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
                {Object.keys(formData).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-2">No fields added yet</p>
                    <Button variant="link" onClick={addCategory}>
                      Click to add a field
                    </Button>
                  </div>
                ) : (
                  Object.entries(formData).map(([key, value]) => (
                    <div key={key} className="flex gap-2 items-center">
                      <Input value={key} disabled className="flex-1" />
                      <Input
                        type="number"
                        value={value}
                        onChange={(e) => updateCategory(key, e.target.value)}
                        className="w-32"
                        placeholder="Value"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCategory(key)}
                        className="text-destructive hover:text-destructive/90"
                      >
                        <AiOutlineClose className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Record - Year {formYear}</DialogTitle>
            <DialogDescription>
              Update data values for the selected year.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Update Data Fields</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addCategory}
                  className="text-primary h-8"
                >
                  <AiOutlinePlus className="mr-1 h-3 w-3" /> Add Field
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
                {Object.entries(formData).map(([key, value]) => (
                  <div key={key} className="flex gap-2 items-center">
                    <Input value={key} disabled className="flex-1" />
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => updateCategory(key, e.target.value)}
                      className="w-32"
                      placeholder="Value"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCategory(key)}
                      className="text-destructive hover:text-destructive/90"
                    >
                      <AiOutlineClose className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the record for year{" "}
              <span className="font-bold text-foreground">
                {selectedRow?.Year}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-4 py-4">
            <AiOutlineWarning className="text-destructive text-3xl flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              All data for this year will be permanently removed from the database.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
