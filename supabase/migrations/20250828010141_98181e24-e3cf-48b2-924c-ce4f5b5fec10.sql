-- Create messages table for internal communication
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL,
    recipient_id UUID NOT NULL, 
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for secure messaging
CREATE POLICY "Users can view their sent messages" 
ON public.messages 
FOR SELECT 
USING (sender_id = auth.uid());

CREATE POLICY "Users can view their received messages" 
ON public.messages 
FOR SELECT 
USING (recipient_id = auth.uid());

CREATE POLICY "Users can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their received messages" 
ON public.messages 
FOR UPDATE 
USING (recipient_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();