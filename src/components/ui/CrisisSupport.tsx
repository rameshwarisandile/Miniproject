import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Phone, MessageCircle, Heart, Shield, AlertTriangle, Users, MapPin, Clock, Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

interface SafetyPlan {
  id: string;
  title: string;
  description: string;
  category: "warning-signs" | "coping-strategies" | "distractions" | "support-people" | "professional-help";
}

const CrisisSupport = () => {
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    {
      id: "1",
      name: "National Suicide Prevention Lifeline",
      relationship: "24/7 Crisis Support",
      phone: "988",
      isPrimary: true
    },
    {
      id: "2",
      name: "Crisis Text Line",
      relationship: "Text Support",
      phone: "Text HOME to 741741",
      isPrimary: false
    }
  ]);

  const [newContact, setNewContact] = useState({
    name: "",
    relationship: "",
    phone: ""
  });

  const [safetyPlan, setSafetyPlan] = useState<SafetyPlan[]>([
    {
      id: "1",
      title: "Warning Signs",
      description: "Feeling hopeless, extreme mood swings, talking about death, withdrawing from others",
      category: "warning-signs"
    },
    {
      id: "2",
      title: "Coping Strategies",
      description: "Deep breathing, calling a friend, going for a walk, listening to music",
      category: "coping-strategies"
    },
    {
      id: "3",
      title: "Distractions",
      description: "Reading a book, watching a movie, doing puzzles, drawing or coloring",
      category: "distractions"
    }
  ]);

  const [newSafetyItem, setNewSafetyItem] = useState({
    title: "",
    description: "",
    category: "coping-strategies" as const
  });

  const addEmergencyContact = () => {
    if (newContact.name && newContact.phone) {
      const contact: EmergencyContact = {
        id: Date.now().toString(),
        name: newContact.name,
        relationship: newContact.relationship,
        phone: newContact.phone,
        isPrimary: false
      };
      
      setEmergencyContacts(prev => [...prev, contact]);
      setNewContact({ name: "", relationship: "", phone: "" });
    }
  };

  const removeEmergencyContact = (id: string) => {
    setEmergencyContacts(prev => prev.filter(contact => contact.id !== id));
  };

  const addSafetyPlanItem = () => {
    if (newSafetyItem.title && newSafetyItem.description) {
      const item: SafetyPlan = {
        id: Date.now().toString(),
        title: newSafetyItem.title,
        description: newSafetyItem.description,
        category: newSafetyItem.category
      };
      
      setSafetyPlan(prev => [...prev, item]);
      setNewSafetyItem({ title: "", description: "", category: "coping-strategies" });
    }
  };

  const removeSafetyPlanItem = (id: string) => {
    setSafetyPlan(prev => prev.filter(item => item.id !== id));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "warning-signs":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "coping-strategies":
        return <Heart className="w-4 h-4 text-green-500" />;
      case "distractions":
        return <Shield className="w-4 h-4 text-blue-500" />;
      case "support-people":
        return <Users className="w-4 h-4 text-purple-500" />;
      case "professional-help":
        return <Phone className="w-4 h-4 text-orange-500" />;
      default:
        return <Heart className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "warning-signs":
        return "bg-red-100 text-red-800 border-red-200";
      case "coping-strategies":
        return "bg-green-100 text-green-800 border-green-200";
      case "distractions":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "support-people":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "professional-help":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Crisis Alert Banner */}
      <Alert className="mb-8 border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>If you're in crisis or having thoughts of suicide:</strong> Call or text 988 immediately, 
          or text HOME to 741741 to reach the Crisis Text Line. You're not alone, and help is available 24/7.
        </AlertDescription>
      </Alert>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
          Crisis Support & Safety
        </h1>
        <p className="text-xl text-muted-foreground">
          Immediate help and resources when you need them most
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Emergency Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="w-5 h-5 text-red-500" />
              <span>Emergency Contacts</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {emergencyContacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold">{contact.name}</h4>
                    {contact.isPrimary && (
                      <Badge variant="destructive" className="text-xs">Primary</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                  <p className="text-sm font-medium text-blue-600">{contact.phone}</p>
                </div>
                {!contact.isPrimary && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEmergencyContact(contact.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}

            {/* Add New Contact Form */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-medium">Add Personal Contact</h4>
              <Input
                placeholder="Contact Name"
                value={newContact.name}
                onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Relationship"
                value={newContact.relationship}
                onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
              />
              <Input
                placeholder="Phone Number"
                value={newContact.phone}
                onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
              />
              <Button onClick={addEmergencyContact} className="w-full" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <span>Quick Access Resources</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Button 
                variant="destructive" 
                size="lg" 
                className="w-full h-16 text-lg font-semibold"
                onClick={() => window.open('tel:988', '_self')}
              >
                <Phone className="w-5 h-5 mr-2" />
                Call 988 - Suicide Prevention
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full h-16 text-lg font-semibold border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={() => window.open('https://www.crisistextline.org/', '_blank')}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Crisis Text Line
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full h-16 text-lg font-semibold border-green-300 text-green-700 hover:bg-green-50"
                onClick={() => window.open('https://988lifeline.org/', '_blank')}
              >
                <Heart className="w-5 h-5 mr-2" />
                More Resources
              </Button>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Remember:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• You are not alone</li>
                <li>• Your feelings are valid</li>
                <li>• Help is available 24/7</li>
                <li>• This feeling will pass</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Safety Planning */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-500" />
            <span>Safety Planning</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Create a personalized safety plan to help you through difficult moments
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {safetyPlan.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  {getCategoryIcon(item.category)}
                  <Badge className={getCategoryColor(item.category)}>
                    {item.category.replace('-', ' ')}
                  </Badge>
                </div>
                <h4 className="font-semibold mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSafetyPlanItem(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            ))}
          </div>

          {/* Add New Safety Plan Item */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">Add to Your Safety Plan</h4>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <Input
                placeholder="Title"
                value={newSafetyItem.title}
                onChange={(e) => setNewSafetyItem(prev => ({ ...prev, title: e.target.value }))}
              />
              <Select 
                value={newSafetyItem.category} 
                onValueChange={(value: any) => setNewSafetyItem(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warning-signs">Warning Signs</SelectItem>
                  <SelectItem value="coping-strategies">Coping Strategies</SelectItem>
                  <SelectItem value="distractions">Distractions</SelectItem>
                  <SelectItem value="support-people">Support People</SelectItem>
                  <SelectItem value="professional-help">Professional Help</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addSafetyPlanItem} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
            <Textarea
              placeholder="Description"
              value={newSafetyItem.description}
              onChange={(e) => setNewSafetyItem(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-purple-500" />
              <span>Local Resources</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-800">Mental Health Clinics</h4>
                <p className="text-sm text-purple-700">Find nearby mental health professionals and clinics</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Search Nearby
                </Button>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800">Support Groups</h4>
                <p className="text-sm text-green-700">Connect with others who understand your experience</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Find Groups
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <span>24/7 Support</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-orange-800">Immediate Crisis</h4>
                <p className="text-sm text-orange-700">Call 988 or 911 for immediate emergency assistance</p>
                <div className="flex space-x-2 mt-2">
                  <Button size="sm" variant="destructive">Call 988</Button>
                  <Button size="sm" variant="outline">Call 911</Button>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800">Online Chat</h4>
                <p className="text-sm text-blue-700">Chat with trained crisis counselors online</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Start Chat
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Important Notice */}
      <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1" />
          <div>
            <h3 className="font-semibold text-yellow-800 mb-2">Important Notice</h3>
            <p className="text-yellow-700 text-sm">
              This app is designed to support your mental wellness journey but is not a substitute for professional medical advice, 
              diagnosis, or treatment. If you're experiencing a mental health crisis or having thoughts of suicide, 
              please contact emergency services immediately or call the National Suicide Prevention Lifeline at 988.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrisisSupport;
