import { Button, Flex, Typography, Box } from '@strapi/design-system';
import React, { useEffect, useState } from 'react';
import { unstable_useContentManagerContext as useContentManagerContext } from '@strapi/strapi/admin';
import { useFetchClient } from '@strapi/strapi/admin';
import { useAuth } from '@strapi/strapi/admin';



const config = {
  locales: [
    'en',
    'vi'
  ],
};

const TransactionActionButtons = () => {
  const cmContext = useContentManagerContext();
  const { user } = useAuth('UserManagement', (state) => ({
    user: state.user,
  }));
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const { put } = useFetchClient();
  
  const aptOrRejCollection = ["additional-transaction", "with-drawth-transaction"]
  // Only show for Additional Transaction content type
  if (!aptOrRejCollection.includes(cmContext.contentType?.apiID)) {
    return null;
  }
  console.log(cmContext);
  // Don't show if status is already DONE or REJECTED
  const currentStatus = cmContext.form.initialValues?.stt;
  console.log(user);
  
  if (currentStatus === 'DONE' || currentStatus === 'REJECTED') {
    return (
      <Box padding={4}>
        <Typography variant="omega">
          Status: <strong>{currentStatus}</strong>
        </Typography>
      </Box>
    );
  }

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      const handlerName = user?.firstname || 'Admin'; // <-- Use current admin username
      const response = await put(
        `/content-manager/collection-types/${cmContext.slug}/${cmContext.id}`,
        {
          stt: 'DONE',
          handle_by: handlerName,
        }
      );
      console.log(response);
      window.location.reload();
    } catch (error) {
      console.error('Error accepting transaction:', error);
    } finally {
      setIsSubmitting(false);
      setIsAcceptDialogOpen(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      const handlerName = user?.firstname || 'Admin'; // <-- Use current admin username
      const response = await put(
        `/content-manager/collection-types/${cmContext.slug}/${cmContext.id}`,
        {
          stt: 'REJECTED',
          reason: rejectReason || 'Rejected by admin',
          handle_by: handlerName,
        }
      );
      console.log(response);
      window.location.reload();
    } catch (error) {
      console.error('Error rejecting transaction:', error);
    } finally {
      setIsSubmitting(false);
      setIsRejectDialogOpen(false);
    }
  };

  return (
    <>
      <Flex gap={2}>
        <Button 
          onClick={handleAccept} 
          variant="success"
          size="S"
        >
          ACCEPT
        </Button>
        <Button 
          onClick={handleReject} 
          variant="danger"
          size="S"
        >
          REJECT
        </Button>
      </Flex>

     
    </>
  );
};

const bootstrap = (app) => {
  app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
    name: 'TransactionActionButtons',
    Component: TransactionActionButtons,
  });
};

export default {
  config,
  bootstrap,
}