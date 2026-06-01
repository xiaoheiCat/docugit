# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.01_05.11.06_6fd0df"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_05.11.06_6fd0df/docugit-darwin-arm64"
      sha256 "9fc30d27d7799a131c2a1c98f3ae0d95e723aa2adc04bcceec167346b0fd369c"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_05.11.06_6fd0df/docugit-darwin-amd64"
      sha256 "77229af1e2c1852d7617b5800d2e09873eda2658cfa71ce9de8ccae239ba4c89"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_05.11.06_6fd0df/docugit-linux-arm64"
      sha256 "69540c36314a9dbe889991992fdb56d511133b56cf433d1dedcb9644738b896b"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_05.11.06_6fd0df/docugit-linux-amd64"
      sha256 "2b14483b3815b7e2f4fe5d186ed3410e0c584b9739260394ae606f50481a6f0f"
    end
  end

  def install
    if OS.mac?
      binary = Hardware::CPU.arm? ? "docugit-darwin-arm64" : "docugit-darwin-amd64"
    else
      binary = Hardware::CPU.arm? ? "docugit-linux-arm64" : "docugit-linux-amd64"
    end
    bin.install binary => "docugit"
  end

  test do
    system "#{bin}/docugit", "--version"
  end
end
