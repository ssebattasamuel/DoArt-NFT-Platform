import Heading from '../ui/Heading';
import Row from '../ui/Row';

function Account() {
  return (
    <>
      <Heading as="h1">Update your Account</Heading>;
      <Row>
        <Heading as="h3"> Update User Data </Heading>
        <p>Update user data form</p>
      </Row>
      <Row>
        <Heading as="h3">Update your Password</Heading>
        <p>Update password form </p>
      </Row>
    </>
  );
}

export default Account;
