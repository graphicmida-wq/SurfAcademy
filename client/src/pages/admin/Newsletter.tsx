import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Mail, TrendingUp, Search } from "lucide-react";
import type { NewsletterContact, NewsletterCampaign } from "@shared/schema";

export default function AdminNewsletter() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: contacts, isLoading: contactsLoading } = useQuery<NewsletterContact[]>({
    queryKey: ["/api/admin/newsletter/contacts"],
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<NewsletterCampaign[]>({
    queryKey: ["/api/admin/newsletter/campaigns"],
  });

  const filteredContacts = contacts?.filter(c => 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.firstName && c.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.lastName && c.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const confirmedCount = contacts?.filter(c => c.status === 'confirmed').length || 0;
  const pendingCount = contacts?.filter(c => c.status === 'pending').length || 0;
  const totalSent = campaigns?.reduce((sum, c) => sum + (c.totalSent || 0), 0) || 0;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      confirmed: "default",
      pending: "secondary",
      unsubscribed: "outline",
      bounced: "destructive",
      spam: "destructive",
    };
    
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getCampaignStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      scheduled: "secondary",
      sending: "default",
      sent: "default",
    };
    
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Newsletter</h1>
          <p className="text-muted-foreground">Gestisci contatti e campagne email</p>
        </div>
        <Button data-testid="button-create-campaign">
          <Mail className="mr-2 h-4 w-4" />
          Nuova Campagna
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
            <CardTitle className="text-sm font-medium">Iscritti Confermati</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-confirmed-count">{confirmedCount}</div>
            <p className="text-xs text-muted-foreground">
              {pendingCount} in attesa di conferma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
            <CardTitle className="text-sm font-medium">Campagne Inviate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-campaigns-count">
              {campaigns?.filter(c => c.status === 'sent').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {campaigns?.filter(c => c.status === 'draft').length || 0} bozze
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
            <CardTitle className="text-sm font-medium">Email Inviate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-sent">{totalSent}</div>
            <p className="text-xs text-muted-foreground">Totale email inviate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="contacts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contacts" data-testid="tab-contacts">
            Contatti ({contacts?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">
            Campagne ({campaigns?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-contacts"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista Contatti</CardTitle>
            </CardHeader>
            <CardContent>
              {contactsLoading ? (
                <p>Caricamento...</p>
              ) : (
                <div className="space-y-2">
                  {filteredContacts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Nessun contatto trovato</p>
                  ) : (
                    <div className="space-y-1">
                      {filteredContacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-center justify-between p-3 rounded-lg hover-elevate"
                          data-testid={`contact-${contact.id}`}
                        >
                          <div>
                            <p className="font-medium">{contact.email}</p>
                            {(contact.firstName || contact.lastName) && (
                              <p className="text-sm text-muted-foreground">
                                {contact.firstName} {contact.lastName}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(contact.status)}
                            {contact.tags && contact.tags.length > 0 && (
                              <div className="flex gap-1">
                                {contact.tags.map((tag, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campagne Email</CardTitle>
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <p>Caricamento...</p>
              ) : campaigns && campaigns.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nessuna campagna creata</p>
              ) : (
                <div className="space-y-2">
                  {campaigns?.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-3 rounded-lg hover-elevate"
                      data-testid={`campaign-${campaign.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                        {campaign.sentAt && (
                          <p className="text-xs text-muted-foreground">
                            Inviata: {new Date(campaign.sentAt).toLocaleDateString('it-IT')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {campaign.totalSent !== null && campaign.totalSent > 0 && (
                          <div className="text-right text-sm">
                            <p className="font-medium">{campaign.totalSent} inviate</p>
                            {campaign.totalOpened !== null && campaign.totalOpened > 0 && (
                              <p className="text-muted-foreground">
                                {campaign.totalOpened} aperture
                              </p>
                            )}
                          </div>
                        )}
                        {getCampaignStatusBadge(campaign.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
