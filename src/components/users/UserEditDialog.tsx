import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import type { User, Role, Tier } from '@/models/core';
import { validateWrikeName } from '@/lib/permissions';

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  roles: Role[];
  tiers: Tier[];
  onSave: (user: Partial<User>) => void;
  onDelete?: (userId: string) => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  roleId: string;
  tierId: string;
  phone: string;
  timezone: string;
  mfaEnabled: boolean;
  status: 'active' | 'suspended';
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  roleId?: string;
  tierId?: string;
  wrikeName?: string;
}

export function UserEditDialog({ 
  open, 
  onOpenChange, 
  user, 
  roles, 
  tiers, 
  onSave, 
  onDelete 
}: UserEditDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    roleId: '',
    tierId: '',
    phone: '',
    timezone: '',
    mfaEnabled: false,
    status: 'active'
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!user;
  const computedWrikeName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        displayName: user.displayName || '',
        email: user.email || '',
        roleId: user.roleId || '',
        tierId: user.tierId || '',
        phone: user.phone || '',
        timezone: user.timezone || '',
        mfaEnabled: user.mfaEnabled || false,
        status: user.status || 'active'
      });
    } else {
      // Reset for new user
      setFormData({
        firstName: '',
        lastName: '',
        displayName: '',
        email: '',
        roleId: '',
        tierId: '',
        phone: '',
        timezone: '',
        mfaEnabled: false,
        status: 'active'
      });
    }
    setErrors({});
  }, [user, open]);

  // Auto-update display name when first/last name changes
  useEffect(() => {
    if (formData.firstName && formData.lastName && !isEditMode) {
      setFormData(prev => ({
        ...prev,
        displayName: `${formData.firstName} ${formData.lastName}`
      }));
    }
  }, [formData.firstName, formData.lastName, isEditMode]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.roleId) {
      newErrors.roleId = 'Role is required';
    }

    if (!formData.tierId) {
      newErrors.tierId = 'Tier is required';
    }

    // Validate wrikeName format
    if (formData.firstName.trim() && formData.lastName.trim()) {
      const expectedWrikeName = computedWrikeName;
      if (!validateWrikeName(formData.firstName.trim(), formData.lastName.trim(), expectedWrikeName)) {
        newErrors.wrikeName = 'wrikeName validation failed (this should not happen)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const userData: Partial<User> = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        displayName: formData.displayName.trim(),
        email: formData.email.trim(),
        roleId: formData.roleId,
        tierId: formData.tierId,
        phone: formData.phone.trim() || undefined,
        timezone: formData.timezone.trim() || undefined,
        mfaEnabled: formData.mfaEnabled,
        status: formData.status,
        wrikeName: computedWrikeName,
        wrikeSync: true, // Always enable Wrike sync for new/updated users
        updatedAt: new Date()
      };

      if (!isEditMode) {
        userData.uid = `u_${Date.now()}`;
        userData.authProvider = 'password'; // Default to password auth
        userData.createdAt = new Date();
      } else {
        userData.uid = user.uid;
      }

      onSave(userData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (user && onDelete && confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      onDelete(user.uid);
      onOpenChange(false);
    }
  };

  const getRoleName = (roleId: string) => {
    return roles.find(r => r.roleId === roleId)?.name || roleId;
  };

  const getTierName = (tierId: string) => {
    return tiers.find(t => t.tierId === tierId)?.name || tierId;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update user information and permissions' 
              : 'Create a new user account with role and tier assignments'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.firstName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Role and Tier */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select 
                value={formData.roleId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, roleId: value }))}
              >
                <SelectTrigger className={errors.roleId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.roleId} value={role.roleId}>
                      <div className="flex items-center gap-2">
                        <span>{role.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {role.permissions.length} permissions
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.roleId && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.roleId}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tier">Tier *</Label>
              <Select 
                value={formData.tierId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, tierId: value }))}
              >
                <SelectTrigger className={errors.tierId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  {tiers.map(tier => (
                    <SelectItem key={tier.tierId} value={tier.tierId}>
                      <div className="flex items-center gap-2">
                        <span>{tier.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {tier.permissions.length} permissions
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tierId && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.tierId}
                </p>
              )}
            </div>
          </div>

          {/* Wrike Name Display */}
          {formData.firstName && formData.lastName && (
            <div className="space-y-2">
              <Label>Wrike Name (Auto-generated)</Label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono">
                  {computedWrikeName}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  This will be used in Wrike exports
                </span>
              </div>
              {errors.wrikeName && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.wrikeName}
                </p>
              )}
            </div>
          )}

          {/* Optional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={formData.timezone}
                onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                placeholder="e.g., America/Los_Angeles"
              />
            </div>
          </div>

          {/* Status and Options */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'active' | 'suspended') => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="suspended">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                      Suspended
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="mfaEnabled"
                checked={formData.mfaEnabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, mfaEnabled: !!checked }))}
              />
              <Label htmlFor="mfaEnabled">Enable Multi-Factor Authentication (MFA)</Label>
            </div>
          </div>

          {/* Permission Preview */}
          {formData.roleId && formData.tierId && (
            <div className="space-y-2 p-3 bg-muted/20 rounded-lg">
              <Label className="text-sm font-medium">Effective Permissions Preview</Label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Role:</span>
                <Badge variant="outline">{getRoleName(formData.roleId)}</Badge>
                <span>+</span>
                <span>Tier:</span>
                <Badge variant="outline">{getTierName(formData.tierId)}</Badge>
              </div>
            </div>
          )}
        </form>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {isEditMode && onDelete && (
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  Delete User
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : (isEditMode ? 'Update User' : 'Create User')}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}