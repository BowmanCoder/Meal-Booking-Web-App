from django.db import models
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser
import uuid

# Create your models here.


class MealUserManager(BaseUserManager):
    def create_user(
        self,
        email,
        date_of_birth,
        fullname,
        username,
        contact,
        gender,
        address,
        password=None,
        password2=None,
    ):
        """
        Creates and saves a User with the given above
        """
        if not email:
            raise ValueError("Users must have an email address")

        user = self.model(
            email=self.normalize_email(email),
            date_of_birth=date_of_birth,
            fullname=fullname,
            username=username,
            contact=contact,
            gender=gender,
            address=address,
        )

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(
        self,
        email,
        date_of_birth,
        fullname,
        username,
        contact,
        gender,
        address,
        password=None,
    ):
        """
        Creates and saves a superuser with the given email, date of
        birth and password.
        """
        user = self.create_user(
            email,
            password=password,
            date_of_birth=date_of_birth,
            fullname=fullname,
            username=username,
            contact=contact,
            gender=gender,
            address=address,
        )
        user.is_admin = True
        user.save(using=self._db)
        return user


class MealUser(AbstractBaseUser):
    fullname = models.TextField()
    username = models.TextField()
    email = models.EmailField(
        verbose_name="email",
        max_length=255,
        unique=True,
    )
    date_of_birth = models.DateField()

    contact = models.CharField(max_length=10)
    gender = models.TextField()
    address = models.TextField()
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = MealUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = [
        "username",
        "date_of_birth",
        "fullname",
        "contact",
        "gender",
        "address",
    ]

    def __str__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        "Does the user have a specific permission?"
        # Simplest possible answer: Yes, always
        return self.is_admin

    def has_module_perms(self, app_label):
        "Does the user have permissions to view the app `app_label`?"
        # Simplest possible answer: Yes, always
        return True

    @property
    def is_staff(self):
        "Is the user a member of staff?"
        # Simplest possible answer: All admins are staff
        return self.is_admin


class Uni(models.Model):
    couponid = models.CharField(max_length=36, default=uuid.uuid4, editable=False)
    email = models.ForeignKey(
        MealUser, to_field="id", on_delete=models.PROTECT, blank=True, null=True
    )
    startdate = models.DateField(null=True, blank=True)
    enddate = models.DateField(null=True, blank=True)
    couponredeem = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "uniTab"
